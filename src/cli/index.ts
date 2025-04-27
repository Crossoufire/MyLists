#!/usr/bin/env node
import {Command} from "commander";
import {registerAllCommands} from "@/cli/commands";


const program = new Command();


program
    .name("mylists-cli")
    .description("CLI tools for MyLists")
    .version("0.0.1");


registerAllCommands(program);


program.parse(process.argv);


if (!process.argv.slice(2).length) {
    program.outputHelp();
}
