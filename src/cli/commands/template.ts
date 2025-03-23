import {Command} from "commander";


export function registerTemplateCommand(program: Command): void {
    program
        .command("template")
        .description("Template command - replace with your own functionality")
        .option("-o, --option <value>", "an example option")
        .option("-f, --flag", "an example flag")
        .action((options) => {
            console.log("Template command executed with options:", options);
            // Implement your command functionality here
        });
}
