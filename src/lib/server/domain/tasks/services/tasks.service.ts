import pino from "pino";
import pinoLogger from "@/lib/server/core/pino-logger";
import {MediaType} from "@/lib/server/utils/enums";
import {MediaProviderRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


type TaskHandler = () => Promise<void>;
type TasksName = "bulkMediaRefresh" | "updateTokens" | "updateAchievements";


export class TasksService {
    private logger: pino.Logger;
    private taskHandlers: Map<TasksName, TaskHandler>;

    constructor(
        private mediaServiceRegistry: typeof MediaServiceRegistry,
        private mediaProviderRegistry: typeof MediaProviderRegistry,
    ) {
        this.logger = pinoLogger.child({ service: "TasksService" });
        this.taskHandlers = new Map<TasksName, TaskHandler>([
            ["bulkMediaRefresh", this.runBulkMediaRefresh.bind(this)],
        ]);
    }

    async runTask(taskName: TasksName) {
        const taskLogger = this.logger.child({ taskName });
        taskLogger.info("Received the request to run this task");

        const startTime = Date.now();

        const taskHandler = this.taskHandlers.get(taskName);
        if (!taskHandler) {
            throw new Error(`Unknown task name: ${taskName}`);
        }

        await taskHandler();
        const duration = (Date.now() - startTime);
        taskLogger.info({ durationMs: duration }, "Task completed");
    }

    private async runBulkMediaRefresh() {
        const mediaTypes = [MediaType.MOVIES];

        for (const mediaType of mediaTypes) {
            this.logger.info({ mediaType }, `Refreshing media for ${mediaType}...`);

            const mediaProviderService = this.mediaProviderRegistry.getService(mediaType);
            if (!isRefreshable(mediaProviderService)) {
                this.logger.warn({ mediaType }, `Refresh method not available for ${mediaType}. Skipping.`);
                continue;
            }

            const results = await mediaProviderService.bulkProcessAndRefreshMedia();
            results.forEach((result) => {
                if (result.status === "rejected") {
                    this.logger.error({ err: result.reason.message }, `Error refreshing ${mediaType}`);
                }
            });

            this.logger.info({ mediaType }, `Refreshing ${mediaType} completed.`);
        }

        this.logger.info("Completed: Bulk Media Refresh execution.");
    }
}


function isRefreshable(service: any) {
    return service && typeof service.bulkProcessAndRefreshMedia === "function";
}
