import {taskDefinitions} from "@/cli/commands";
import {redirect} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {deriveMQJobStatus} from "@/lib/utils/helpers";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {getCookie, setCookie} from "@tanstack/react-start/server";
import {createAdminToken, verifyAdminToken} from "@/lib/server/utils/jwt-utils";
import {ADMIN_COOKIE_NAME, adminAuthMiddleware, managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {
    adminUpdateAchievementSchema,
    getAdminJobSchema,
    getAdminJobsSchema,
    postAdminUpdateTiersSchema,
    postAdminUpdateUserSchema,
    postTriggerLongTasksSchema,
    searchTypeAdminSchema,
    searchTypeSchema
} from "@/lib/server/types/base.types";


const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 1 * 60 * 1000, // 1 minute
    path: "/"
};


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
    .validator((data) => data as { password: string })
    .handler(async ({ data }) => {
        if (data.password === process.env.ADMIN_PASSWORD as string) {
            const adminToken = createAdminToken();
            setCookie(ADMIN_COOKIE_NAME, adminToken, COOKIE_OPTIONS);
            return { success: true };
        }

        return { success: false, message: "Incorrect Password" };
    });


export const adminLogout = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        setCookie(ADMIN_COOKIE_NAME, "", { ...COOKIE_OPTIONS, maxAge: 0 });
        throw redirect({ to: "/" });
    });


export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getAdminOverview();
    });


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(searchTypeAdminSchema)
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
    .validator(searchTypeSchema)
    .handler(async ({ data }) => {
        const mediadleService = await getContainer().then((c) => c.services.mediadle);
        return mediadleService.getAdminAllUsersStats(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(postAdminUpdateUserSchema)
    .handler(async ({ data: { userId, payload } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.adminUpdateUser(userId, payload);
    });


export const postAdminUpdateAchievement = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(adminUpdateAchievementSchema)
    .handler(async ({ data: { achievementId, name, description } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.adminUpdateAchievement(achievementId, name, description);
    });


export const postAdminUpdateTiers = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(postAdminUpdateTiersSchema)
    .handler(async ({ data: { tiers } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.adminUpdateTiers(tiers);
    });


export const getAdminTasks = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async () => {
        return taskDefinitions;
    });


export const postTriggerLongTasks = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(postTriggerLongTasksSchema)
    .handler(async ({ data: { taskName } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            const job = await mylistsLongTaskQueue.add(taskName, { triggeredBy: "dashboard" });
            return {
                jobId: job.id,
                success: true,
                message: "Task enqueued.",
            };
        }
        catch (error) {
            throw new FormattedError("Failed to enqueue task.");
        }
    });


export const getAdminJobs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(getAdminJobsSchema)
    .handler(async ({ data: { types } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            const jobs = await mylistsLongTaskQueue.getJobs(types);
            return jobs.map((job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
                progress: job.progress,
                timestamp: job.timestamp,
                finishedOn: job.finishedOn,
                stacktrace: job.stacktrace,
                returnValue: job.returnvalue,
                processedOn: job.processedOn,
                failedReason: job.failedReason,
                attemptsMade: job.attemptsMade,
                status: deriveMQJobStatus(job),
            }));
        }
        catch (error) {
            throw new FormattedError("Failed to fetch jobs. Check Worker is Active.");
        }
    });


export const getAdminJobLogs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .validator(getAdminJobSchema)
    .handler(async ({ data: { jobId } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            return mylistsLongTaskQueue.getJobLogs(jobId);
        }
        catch (error) {
            throw new FormattedError("Failed to fetch job logs.");
        }
    });
