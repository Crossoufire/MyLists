import {z} from "zod";
import {serverEnv} from "@/env/server";
import {auth} from "@/lib/server/core/auth";
import {redirect} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {runTask} from "@/lib/server/tasks/task-runner";
import {FormattedError} from "@/lib/utils/error-classes";
import {getContainer} from "@/lib/server/core/container";
import {setSignedCookie} from "@/lib/utils/auth-cookies";
import {tryFormZodError} from "@/lib/utils/try-not-found";
import {VISITS_CACHE_KEY} from "@/lib/server/domain/user";
import {deleteCookie} from "@tanstack/react-start/server";
import {getAllTasksMetadata, getTask} from "@/lib/server/tasks/registry";
import {ADMIN_COOKIE_NAME, isAdminAuthenticated, setAdminCookie} from "@/lib/utils/admin-token";
import {adminAuthMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
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
    .handler(async ({ context: { currentUser } }) => {
        return isAdminAuthenticated(currentUser.id);
    });


export const adminAuth = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .inputValidator((data) => z.object({ password: z.string() }).parse(data))
    .handler(async ({ data, context: { currentUser } }) => {
        if (data.password !== serverEnv.ADMIN_PASSWORD) {
            return { success: false, message: "Incorrect Password" };
        }

        await setAdminCookie(currentUser.id);
        return { success: true };
    });


export const adminLogout = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        deleteCookie(ADMIN_COOKIE_NAME);
        throw redirect({ to: "/" });
    });


export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
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
    .middleware([adminAuthMiddleware])
    .handler(async () => {
        const adminService = await getContainer().then((c) => c.services.admin);
        const mediaServiceRegistry = await getContainer().then((c) => c.registries.mediaService);

        return adminService.getMediaOverviewForAdmin(mediaServiceRegistry);
    });


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .inputValidator(searchTypeAdminSchema)
    .handler(async ({ data }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getPaginatedUsersForAdmin(data);
    });


export const getAdminAchievements = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .handler(async () => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.getAllAchievements();
    });


export const getAdminMediadleStats = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .inputValidator(searchTypeSchema)
    .handler(async ({ data }) => {
        const mediadleService = await getContainer().then((c) => c.services.mediadle);
        return mediadleService.getAllUsersStatsForAdmin(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator(postAdminUpdateUserSchema)
    .handler(async ({ data: { userId, payload } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.updateUserForAdmin(userId, payload);
    });


export const postAdminUpdateAchievement = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator(adminUpdateAchievementSchema)
    .handler(async ({ data: { achievementId, name, description } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.updateAchievementForAdmin(achievementId, name, description);
    });


export const postAdminUpdateTiers = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator(postAdminUpdateTiersSchema)
    .handler(async ({ data: { tiers } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.updateTiersForAdmin(tiers);
    });


export const getAdminTasks = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .handler(async () => getAllTasksMetadata());


export const postAdminTriggerTask = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator(adminTriggerTaskSchema)
    .handler(async ({ data: { taskName, input } }) => {
        const task = getTask(taskName);
        if (!task) throw new Error(`Task ${taskName} not found`);

        const validatedInput = tryFormZodError(task.inputSchema)(input);

        await runTask({
            taskName: task.name,
            triggeredBy: "dashboard",
            input: validatedInput as any,
        });
    });


export const getAdminArchivedTasks = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .handler(async () => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.getArchivedTasksForAdmin();
    });


export const postAdminDeleteArchivedTask = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator(adminDeleteArchivedTaskSchema)
    .handler(async ({ data: { taskId } }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.deleteArchivedTaskForAdmin(taskId);
    });


export const getAdminErrorLogs = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .inputValidator(searchTypeAdminSchema)
    .handler(async ({ data }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.getPaginatedErrorLogs(data);
    });


export const postAdminDeleteErrorLog = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator(adminDeleteErrorLogSchema)
    .handler(async ({ data: { errorIds } }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.deleteErrorLogs(errorIds);
    });


export const getAdminUserTracking = createServerFn({ method: "GET" })
    .middleware([adminAuthMiddleware])
    .inputValidator((data) => z.object({ userId: z.coerce.number().int().positive() }).parse(data))
    .handler(async ({ data: { userId } }) => {
        const adminService = await getContainer().then((c) => c.services.admin);
        return adminService.getAdminUserTracking(userId);
    });


export const postImpersonateUser = createServerFn({ method: "POST" })
    .middleware([adminAuthMiddleware])
    .inputValidator((data) => z.object({ userId: z.coerce.number().int().positive() }).parse(data))
    .handler(async ({ data: { userId } }) => {
        const ctx = await auth.$context;
        const prefix = ctx.options?.advanced?.cookiePrefix ?? "better-auth";
        const cookies = { sessionData: `${prefix}.session_data`, sessionToken: `${prefix}.session_token` };

        const targetUser = await ctx.internalAdapter.findUserById(String(userId));
        if (!targetUser) throw new FormattedError("User not found");

        // 10 min session
        const newSession = await ctx.internalAdapter.createSession(
            targetUser.id,
            true,
            { expiresAt: new Date(Date.now() + (10 * 60 * 1000)) },
            true,
        );
        if (!newSession) throw new FormattedError("Failed to create session");

        // Delete current user and admin cookie
        deleteCookie(ADMIN_COOKIE_NAME);
        deleteCookie(cookies.sessionData);

        // 10 min cookie
        await setSignedCookie(cookies.sessionToken, newSession.token, ctx.secret, 10 * 60);
    });
