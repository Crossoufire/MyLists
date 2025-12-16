import {Command} from "commander";
import {registerTaskCommand} from "@/cli/register";
import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";


const program = new Command();


const description = `
CLI commands for MyLists.
To execute a command:
'bun run cli -- <command> -<option1> -<option2> ...'
`;


program
    .name("mylists-cli")
    .description(description)
    .version("1.0.0");


taskDefinitions.forEach((task) => registerTaskCommand(program, task));


if (process.argv.slice(2).length) {
    program.parse(process.argv);
}
else {
    program.outputHelp();
}
