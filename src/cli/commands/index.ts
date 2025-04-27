import {Command} from "commander";
import {registerBulkMediaRefreshCommand} from "./bulk-media-refresh";


export function registerAllCommands(program: Command) {
    registerBulkMediaRefreshCommand(program);
}
