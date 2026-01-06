import {z} from "zod";
import {serverEnv} from "@/env/server";
import {redirect} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {runTask} from "@/lib/server/tasks/task-runner";
import {getContainer} from "@/lib/server/core/container";
import {VISITS_CACHE_KEY} from "@/lib/server/domain/user";
import {getTasksByVisibility} from "@/lib/server/tasks/registry";
import {getCookie, setCookie} from "@tanstack/react-start/server";
import {adminCookieOptions, createAdminToken, verifyAdminToken} from "@/lib/utils/jwt-utils";
import {ADMIN_COOKIE_NAME, adminAuthMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {
    adminDeleteArchivedTaskSchema,
    adminDeleteErrorLogSchema,
    adminTriggerTaskSchema,
    adminUpdateAchievementSchema,
    postAdminUpdateTiersSchema,
    postAdminUpdateUserSchema,
    searchTypeAdminSchema,
    searchTypeSchema
} from "@/lib/types/zod.schema.types";


export const checkAdminAuth = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const adminToken = getCookie(ADMIN_COOKIE_NAME);
        return !(!adminToken || !verifyAdminToken(adminToken));
    });


export const adminAuth = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .inputValidator((data) => data as { password: string })
    .handler(async ({ data }) => {
        if (data.password === serverEnv.ADMIN_PASSWORD) {
            const adminToken = createAdminToken();
            setCookie(ADMIN_COOKIE_NAME, adminToken, adminCookieOptions);

            return { success: true };
        }

        return {
            success: false,
            message: "Incorrect Password",
        };
    });


export const adminLogout = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        setCookie(ADMIN_COOKIE_NAME, "", { ...adminCookieOptions, maxAge: 0 });
        throw redirect({ to: "/" });
    });


export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const container = await getContainer();
        const userService = container.services.user;
        const cacheManager = container.cacheManager;

        const visitCounterKey = `${VISITS_CACHE_KEY}:${new Date().getFullYear()}-${new Date().getMonth() + 1}`;
        const visitsThisMonth = await cacheManager.get<number>(visitCounterKey) ?? 0;
        const data = await userService.getUserOverviewForAdmin();

        return { ...data, visitsThisMonth };
    });


export const getAdminMediaOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const adminService = await getContainer().then((c) => c.services.admin);
        const mediaServiceRegistry = await getContainer().then((c) => c.registries.mediaService);

        return adminService.getMediaOverviewForAdmin(mediaServiceRegistry);
    });


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(searchTypeAdminSchema)
    .handler(async ({ data }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getPaginatedUsersForAdmin(data);
    });


export const getAdminAchievements = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.getAllAchievements();
    });


export const getAdminMediadleStats = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(searchTypeSchema)
    .handler(async ({ data }) => {
        const mediadleService = await getContainer().then((c) => c.services.mediadle);
        return mediadleService.getAllUsersStatsForAdmin(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(postAdminUpdateUserSchema)
    .handler(async ({ data: { userId, payload } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.updateUserForAdmin(userId, payload);
    });


export const postAdminUpdateAchievement = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(adminUpdateAchievementSchema)
    .handler(async ({ data: { achievementId, name, description } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.updateAchievementForAdmin(achievementId, name, description);
    });


export const postAdminUpdateTiers = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(postAdminUpdateTiersSchema)
    .handler(async ({ data: { tiers } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.updateTiersForAdmin(tiers);
    });


export const getAdminTasks = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const tasks = getTasksByVisibility("admin");

        return tasks.map((task) => ({
            name: task.name,
            description: task.meta.description,
            inputSchema: z.toJSONSchema(task.inputSchema) as any,
        }));
    });


export const postAdminTriggerTask = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(adminTriggerTaskSchema)
    .handler(async ({ data: { taskName, input } }) => {
        // Pass direct input (z.looseObject({})), validation in `runTask`
        await runTask({
            input,
            taskName: taskName,
            triggeredBy: "dashboard",
        });
    });


export const getAdminArchivedTasks = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.getArchivedTasksForAdmin();
    });


export const postAdminDeleteArchivedTask = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(adminDeleteArchivedTaskSchema)
    .handler(async ({ data: { taskId } }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.deleteArchivedTaskForAdmin(taskId);
    });


export const getAdminErrorLogs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(searchTypeAdminSchema)
    .handler(async ({ data }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.getPaginatedErrorLogs(data);
    });


export const postAdminDeleteErrorLog = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(adminDeleteErrorLogSchema)
    .handler(async ({ data: { errorIds } }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.deleteErrorLogs(errorIds);
    });


export const getAdminUserTracking = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator((data) => data as { userId: number })
    .handler(async ({ data: { userId } }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.getAdminUserTracking(userId);
    });
