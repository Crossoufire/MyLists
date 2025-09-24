import {serverEnv} from "@/env/server";
import {JobType as MqJobType} from "bullmq";
import {redirect} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {getCookie, setCookie} from "@tanstack/react-start/server";
import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";
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
} from "@/lib/types/zod.schema.types";


const COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: 5 * 60 * 1000, // 5 minutes
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
    .inputValidator((data) => data as { password: string })
    .handler(async ({ data }) => {
        if (data.password === serverEnv.ADMIN_PASSWORD) {
            const adminToken = createAdminToken();
            setCookie(ADMIN_COOKIE_NAME, adminToken, COOKIE_OPTIONS);

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
    .handler(async () => taskDefinitions);


export const postTriggerLongTasks = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(postTriggerLongTasksSchema)
    .handler(async ({ data: { taskName } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullmq");

        try {
            const job = await mylistsLongTaskQueue.add(taskName, { triggeredBy: "dashboard" });
            return {
                jobId: job.id,
                success: true,
                message: "Task enqueued.",
            };
        }
        catch {
            throw new FormattedError("Failed to enqueue task.");
        }
    });


export const getAdminJobs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(getAdminJobsSchema)
    .handler(async ({ data: { types } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullmq");

        try {
            const jobs = await mylistsLongTaskQueue.getJobs(types satisfies MqJobType[]);
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
                status: job.failedReason ? "failed"
                    : job.finishedOn ? "completed"
                        : job.processedOn ? "active"
                            : job.timestamp ? "waiting" : "unknown"
            }));
        }
        catch {
            throw new FormattedError("Failed to fetch jobs. Check Worker is Active.");
        }
    });


export const getAdminJobLogs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(getAdminJobSchema)
    .handler(async ({ data: { jobId } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullmq");

        try {
            return mylistsLongTaskQueue.getJobLogs(jobId);
        }
        catch {
            throw new FormattedError("Failed to fetch job logs.");
        }
    });
