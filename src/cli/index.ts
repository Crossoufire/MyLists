#!/usr/bin/env node
import {Command} from "commander";
import {registerAllCommands} from "@/cli/commands";


const program = new Command();


const description = `
CLI commands for MyLists.
To execute a command:
'npm run cli -- <command> -- <option> -- <option> ...'
`;


program
    .name("mylists-cli")
    .description(description)
    .version("1.0.0");


registerAllCommands(program);


program.parse(process.argv);


if (!process.argv.slice(2).length) {
    program.outputHelp();
}
