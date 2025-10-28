import pino from "pino";
import {UserModule} from "@/lib/server/core/container/user.module";
import {TasksService} from "@/lib/server/domain/tasks/services/tasks.service";
import {MediaProviderServiceRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


interface TasksModuleDependencies {
    logger: pino.Logger;
    userModule: UserModule;
    mediaServiceRegistry: typeof MediaServiceRegistry;
    mediaProviderServiceRegistry: typeof MediaProviderServiceRegistry;
}


export function setupTasksModule(deps: TasksModuleDependencies): TasksService {
    return new TasksService(
        deps.logger,
        deps.userModule.repositories.user,
        deps.mediaServiceRegistry,
        deps.mediaProviderServiceRegistry,
        deps.userModule.services.achievements,
        deps.userModule.services.userUpdates,
        deps.userModule.services.notifications,
        deps.userModule.services.userStats,
    );
}
