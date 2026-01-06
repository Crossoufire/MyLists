import {z} from "zod";
import {Command} from "commander";
import {runTask} from "@/lib/server/tasks/task-runner";
import {taskRegistry} from "@/lib/server/tasks/registry";


const program = new Command();

program
    .name("mylists-cli")
    .description("CLI commands for MyLists")
    .version("1.0.0");


// Auto-generate CLI commands from task registry
for (const task of Object.values(taskRegistry)) {
    const cmd = program
        .command(task.name)
        .description(task.meta.description)
        .option("-j, --json", "Output logs as JSON");

    const shape = task.inputSchema.shape;
    const usedShortFlags = new Set<string>(["j"]);

    for (const [key, validator] of Object.entries(shape)) {
        const zValidator = validator as z.ZodType;
        const meta = getZodMeta(zValidator);

        // Build flag string with typed placeholder
        const placeholder = formatArgPlaceholder(meta);

        // Try use first letter as short flag if not already taken
        const shortChar = key.charAt(0);
        let flag = "";

        if (usedShortFlags.has(shortChar)) {
            flag = `--${key} <${placeholder}>`;
        }
        else {
            flag = `-${shortChar}, --${key} <${placeholder}>`;
            usedShortFlags.add(shortChar);
        }

        // Build description
        let description = zValidator.description || "";
        if (meta.enumValues) {
            description += ` [choices: ${meta.enumValues.join(", ")}]`;
        }

        if (meta.defaultValue === undefined) {
            cmd.option(flag, description);
        }
        else {
            cmd.option(flag, description, meta.defaultValue);
        }
    }

    cmd.action(async (options) => {
        const { json, ...input } = options;

        await runTask({
            input,
            stdoutAsJson: json,
            taskName: task.name,
            triggeredBy: "cron/cli",
        });

        process.exit(0);
    });
}


if (process.argv.slice(2).length) {
    program.parse(process.argv);
}
else {
    program.outputHelp();
}


function getZodMeta(schema: z.ZodType) {
    let current = schema;
    let def = current._zod.def as any;
    let defaultValue: string | boolean | string[] | undefined = undefined;

    while (def.type === "default" || def.type === "optional" || def.type === "nullable") {
        if (def.type === "default" && def.defaultValue !== undefined) {
            const raw = def.defaultValue;
            if (typeof raw === "string" || typeof raw === "boolean" ||
                (Array.isArray(raw) && raw.every((v) => typeof v === "string"))) {
                defaultValue = raw;
            }
        }

        current = def.innerType;
        def = current._zod.def as any;
    }

    const baseType: string = def.type;

    let enumValues: readonly string[] | undefined;
    if (baseType === "enum" && Array.isArray(def.entries)) {
        enumValues = def.entries;
    }

    return { baseType, enumValues, defaultValue };
}


function formatArgPlaceholder(meta: ReturnType<typeof getZodMeta>) {
    if (meta.enumValues) {
        return meta.enumValues.join("|");
    }

    switch (meta.baseType) {
        case "number":
        case "int":
            return "number";
        case "boolean":
            return "boolean";
        case "string":
        default:
            return "string";
    }
}
