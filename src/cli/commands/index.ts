import {Command} from "commander";
import {registerTemplateCommand} from "./template";


export function registerAllCommands(program: Command) {
    registerTemplateCommand(program);
}
