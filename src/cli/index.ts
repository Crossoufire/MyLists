import {z} from "zod";
import {Command} from "commander";
import {runTask} from "@/lib/server/tasks/task-runner";
import {getAllTasks} from "@/lib/server/tasks/registry";


const program = new Command();

program
    .name("mylists-cli")
    .description("CLI commands for MyLists")
    .version("1.0.0");

const tasks = getAllTasks();
for (const task of tasks) {
    const cmd = program
        .command(task.name)
        .description(task.description)
        .option("-j, --json", "Output logs as JSON");

    const cliOptions = extractCLIOptions(task.inputSchema);
    for (const option of cliOptions) {
        if (option.required) {
            cmd.requiredOption(option.flag, option.description);
        }
        else if (option.defaultValue !== undefined) {
            cmd.option(option.flag, option.description, String(option.defaultValue));
        }
        else {
            cmd.option(option.flag, option.description);
        }
    }

    cmd.action(async (options) => {
        const input = parseCliOptions(options, cliOptions);

        console.log(`\nRunning task: ${task.name}`);
        console.log(`Input: ${JSON.stringify(input, null, 2)}\n`);

        try {
            await runTask({
                input: input as any,
                taskName: task.name,
                triggeredBy: "cron/cli",
                stdoutAsJson: options.json,
            });
        }
        catch (error) {
            console.error("Failed to run task:", error);
            process.exit(1);
        }
    });
}


if (process.argv.slice(2).length) {
    program.parse(process.argv);
}
else {
    program.outputHelp();
}


interface CLIOption {
    flag: string;
    required: boolean;
    description: string;
    enumValues?: string[];
    arrayItemType?: "string" | "number";
    defaultValue?: string | number | boolean | string[];
    type: "string" | "number" | "boolean" | "enum" | "array";
}


function parseCliOptions(options: Record<string, any>, definitions: CLIOption[]) {
    const result: Record<string, any> = {};

    for (const def of definitions) {
        const match = def.flag.match(/--([a-z-]+)/);
        if (!match) continue;

        const kebabKey = match[1];
        const camelKey = kebabKey.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
        const value = options[camelKey];

        if (value === undefined) {
            if (def.defaultValue !== undefined) {
                result[camelKey] = def.defaultValue;
            }
            continue;
        }

        switch (def.type) {
            case "number":
                result[camelKey] = Number(value);
                break;
            case "boolean":
                result[camelKey] = value === true || value === "true";
                break;
            case "enum":
                if (def.enumValues && !def.enumValues.includes(value)) {
                    throw new Error(
                        `Invalid value "${value}" for ${camelKey}. Valid: ${def.enumValues.join(", ")}`
                    );
                }
                result[camelKey] = value;
                break;
            case "array":
                const arr = Array.isArray(value) ? value : [value];
                if (def.arrayItemType === "number") {
                    result[camelKey] = arr.map(Number);
                }
                else {
                    result[camelKey] = arr;
                }
                if (def.enumValues) {
                    for (const item of result[camelKey]) {
                        if (!def.enumValues.includes(item)) {
                            throw new Error(`Invalid value "${item}" for ${camelKey}. Valid: ${def.enumValues.join(", ")}`);
                        }
                    }
                }
                break;
            default:
                result[camelKey] = value;
        }
    }

    return result;
}


function extractCLIOptions(schema: z.ZodType) {
    const options: CLIOption[] = [];
    const takenShortFlags = new Set<string>(["j", "h", "v"]);

    if (schema instanceof z.ZodObject) {
        const shape = schema.shape as Record<string, z.ZodType>;

        for (const [key, fieldSchema] of Object.entries(shape)) {
            const option = extractSingleOption(key, fieldSchema, takenShortFlags);
            if (option) {
                options.push(option);
            }
        }
    }

    return options;
}


function extractSingleOption(key: string, schema: z.ZodType, takenShortFlags: Set<string>): CLIOption | null {
    let required = true;
    let innerSchema = schema;
    let defaultValue: CLIOption["defaultValue"];

    // Unwrap optional
    if (innerSchema instanceof z.ZodOptional) {
        required = false;
        innerSchema = innerSchema.unwrap() as any;
    }

    // Unwrap default
    if (innerSchema instanceof z.ZodDefault) {
        defaultValue = innerSchema.def.defaultValue as any;
        innerSchema = innerSchema.def.innerType as any;
    }

    const description = innerSchema.description ?? `The ${key} parameter`;

    let enumValues: string[] | undefined;
    let type: CLIOption["type"] = "string";
    let arrayItemType: CLIOption["arrayItemType"];

    if (innerSchema instanceof z.ZodNumber) {
        type = "number";
    }
    else if (innerSchema instanceof z.ZodBoolean) {
        type = "boolean";
    }
    else if (innerSchema instanceof z.ZodEnum) {
        type = "enum";
        enumValues = innerSchema.options as string[];
    }
    else if (innerSchema instanceof z.ZodArray) {
        type = "array";
        const elementSchema = innerSchema.element;
        if (elementSchema instanceof z.ZodNumber) {
            arrayItemType = "number";
        }
        else {
            arrayItemType = "string";
        }

        if (elementSchema instanceof z.ZodEnum) {
            enumValues = elementSchema.options as string[];
        }
    }

    // Build flag
    const kebab = kebabCase(key);
    let shortFlag = key[0].toLowerCase();
    if (takenShortFlags.has(shortFlag)) {
        shortFlag = "";
    }
    else {
        takenShortFlags.add(shortFlag);
    }

    const flagBase = shortFlag ? `-${shortFlag}, --${kebab}` : `--${kebab}`;
    const flag = type === "boolean" ? flagBase : type === "array" ? `${flagBase} <values...>` : `${flagBase} <value>`;

    let finalDescription = description;
    if (enumValues) {
        finalDescription += ` (choices: ${enumValues.join(", ")})`;
    }

    return {
        flag,
        type,
        required,
        enumValues,
        defaultValue,
        arrayItemType,
        description: finalDescription,
    };
}


function kebabCase(str: string) {
    return str.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
}
