import {AdminService} from "@/lib/server/domain/admin/admin.service";
import {setupMediaModule} from "@/lib/server/core/container/media.module";
import {setupAdminModule} from "@/lib/server/core/container/admin.module";
import {CacheManager, initCacheManager} from "@/lib/server/core/cache-manager";
import {setupUserModule, UserModule} from "@/lib/server/core/container/user.module";
import {ProviderModule, setupProviderModule} from "@/lib/server/core/container/provider.module";
import {MediaProviderServiceRegistry, MediaRepositoryRegistry, MediaServiceRegistry} from "@/lib/server/domain/media/media.registries";


interface AppContainer {
    cacheManager: CacheManager;
    clients: ProviderModule["clients"];
    repositories: UserModule["repositories"];
    services: UserModule["services"] & { admin: AdminService };
    registries: {
        mediaRepo: typeof MediaRepositoryRegistry;
        mediaService: typeof MediaServiceRegistry;
        mediaProviderService: typeof MediaProviderServiceRegistry;
    };
}


let containerPromise: Promise<AppContainer> | null = null;


async function initContainer(): Promise<AppContainer> {
    const cacheManager = await initCacheManager();
    const apiModule = await setupProviderModule();
    const mediaModule = setupMediaModule(apiModule);
    const userModule = setupUserModule(mediaModule.mediaServiceRegistry);
    const adminService = setupAdminModule();

    return {
        cacheManager,
        clients: apiModule.clients,
        repositories: userModule.repositories,
        services: {
            ...userModule.services,
            admin: adminService,
        },
        registries: {
            mediaRepo: mediaModule.mediaRepoRegistry,
            mediaService: mediaModule.mediaServiceRegistry,
            mediaProviderService: mediaModule.mediaProviderServiceRegistry,
        },
    };
}


export function getContainer() {
    if (!containerPromise) {
        containerPromise = initContainer().then((container) => container);
    }
    return containerPromise;
}
