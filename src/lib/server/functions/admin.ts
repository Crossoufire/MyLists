import {serverEnv} from "@/env/server";
import {redirect} from "@tanstack/react-router";
import {rootLogger} from "@/lib/server/core/logger";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {getCookie, setCookie} from "@tanstack/react-start/server";
import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";
import {addJobAndWakeWorker, createOrGetQueue} from "@/lib/server/core/bullmq";
import {adminCookieOptions, createAdminToken, verifyAdminToken} from "@/lib/utils/jwt-utils";
import {ADMIN_COOKIE_NAME, adminAuthMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {
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

        if (!adminToken || !verifyAdminToken(adminToken)) {
            return false;
        }

        return true;
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
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getAdminOverview();
    });


export const getAdminMediaOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const userService = await getContainer().then((c) => c.services.user);
        const mediaServiceRegistry = await getContainer().then((c) => c.registries.mediaService);

        return userService.getAdminMediaOverview(mediaServiceRegistry);
    });


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(searchTypeAdminSchema)
    .handler(async ({ data }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getAdminPaginatedUsers(data);
    });


export const getAdminAchievements = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.allUsersAchievements();
    });


export const getAdminMediadleStats = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(searchTypeSchema)
    .handler(async ({ data }) => {
        const mediadleService = await getContainer().then((c) => c.services.mediadle);
        return mediadleService.getAdminAllUsersStats(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(postAdminUpdateUserSchema)
    .handler(async ({ data: { userId, payload } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.adminUpdateUser(userId, payload);
    });


export const postAdminUpdateAchievement = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(adminUpdateAchievementSchema)
    .handler(async ({ data: { achievementId, name, description } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.adminUpdateAchievement(achievementId, name, description);
    });


export const postAdminUpdateTiers = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(postAdminUpdateTiersSchema)
    .handler(async ({ data: { tiers } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.adminUpdateTiers(tiers);
    });


export const getAdminTasks = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        return taskDefinitions.filter((task) => task.visibility !== "user");
    });


export const postAdminTriggerTask = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(adminTriggerTaskSchema)
    .handler(async ({ data: { taskName } }) => {
        try {
            await addJobAndWakeWorker(taskName, { triggeredBy: "dashboard" });
        }
        catch (err) {
            rootLogger.error({ err }, "Failed to enqueue task from admin dashboard");
            throw new FormattedError("Failed to enqueue task.");
        }
    });


export const getAdminActiveJobs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const queue = await createOrGetQueue();

        try {
            const jobs = await queue.getJobs(["active", "waiting", "delayed"]);
            return jobs.map((job) => ({
                jobId: job.id,
                name: job.name,
                data: job.data,
                progress: job.progress,
                timestamp: job.timestamp,
                finishedOn: job.finishedOn,
                returnValue: job.returnvalue,
                processedOn: job.processedOn,
                failedReason: job.failedReason,
                status: job.processedOn ? "active" : "waiting"
            }));
        }
        catch {
            throw new FormattedError("Failed to fetch jobs. Check Worker is Active.");
        }
    });


export const getAdminArchivedTasks = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getAdminArchivedTasks();
    });
