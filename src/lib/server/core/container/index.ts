import pino from "pino";
import {Cache} from "cache-manager";
import {rootLogger} from "@/lib/server/core/logger";
import {initCacheManager} from "@/lib/server/core/cache-manager";
import {setupMediaModule} from "@/lib/server/core/container/media.module";
import {setupTasksModule} from "@/lib/server/core/container/tasks.module";
import {TasksService} from "@/lib/server/domain/tasks/services/tasks.service";
import {setupUserModule, UserModule} from "@/lib/server/core/container/user.module";
import {ProviderModule, setupProviderModule} from "@/lib/server/core/container/provider.module";
import {MediaProviderServiceRegistry, MediaRepositoryRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/registries/registries";


interface AppContainer {
    cacheManager: Cache;
    clients: ProviderModule["clients"];
    repositories: UserModule["repositories"];
    transformers: ProviderModule["transformers"];
    services: UserModule["services"] & { tasks: TasksService };
    registries: {
        mediaRepo: typeof MediaRepositoryRegistry;
        mediaService: typeof MediaServiceRegistry;
        mediaProviderService: typeof MediaProviderServiceRegistry;
    };
}


type ContainerOptions = { tasksServiceLogger?: pino.Logger };


let containerPromise: Promise<AppContainer> | null = null;


async function initContainer(options: ContainerOptions = {}): Promise<AppContainer> {
    const cacheManager = await initCacheManager();
    const apiModule = await setupProviderModule();
    const mediaModule = setupMediaModule(apiModule);
    const userModule = setupUserModule(mediaModule.mediaServiceRegistry);
    const tasksService = setupTasksModule({
        userModule,
        logger: options.tasksServiceLogger || rootLogger,
        mediaServiceRegistry: mediaModule.mediaServiceRegistry,
        mediaProviderServiceRegistry: mediaModule.mediaProviderServiceRegistry,
    });

    return {
        cacheManager,
        clients: apiModule.clients,
        transformers: apiModule.transformers,
        repositories: userModule.repositories,
        services: {
            ...userModule.services,
            tasks: tasksService,
        },
        registries: {
            mediaRepo: mediaModule.mediaRepoRegistry,
            mediaService: mediaModule.mediaServiceRegistry,
            mediaProviderService: mediaModule.mediaProviderServiceRegistry,
        },
    };
}


export function getContainer(options: ContainerOptions = {}) {
    if (!containerPromise) {
        containerPromise = initContainer(options).then((container) => container);
    }
    return containerPromise;
}
