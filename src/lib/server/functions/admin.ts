import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {managerAuthMiddleware} from "@/lib/server/middlewares/authentication";


export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const userService = getContainer().services.user;
        return userService.getAdminOverview();
    });


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data }) => {
        const userService = getContainer().services.user;
        return userService.getAdminPaginatedUsers(data);
    });


export const getAdminAchievements = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const achievementService = getContainer().services.achievements;
        return achievementService.getAllAchievements();
    });


export const getAdminMediadleStats = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data }) => {
        const mediadleService = getContainer().services.mediadle;
        return mediadleService.getAdminAllUsersStats(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { userId: number, payload: Record<string, any> })
    .handler(async ({ data: { userId, payload } }) => {
        const userService = getContainer().services.user;
        return userService.adminUpdateUser(userId, payload);
    });


export const postAdminUpdateAchievement = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as {
        achievementId: number,
        payload: Record<string, any>,
    })
    .handler(async ({ data: { achievementId, payload } }) => {
        const achievementService = getContainer().services.achievements;
        return achievementService.adminUpdateAchievement(achievementId, payload);
    });


export const postAdminUpdateTiers = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as {
        payloads: Record<string, any>[],
    })
    .handler(async ({ data: { payloads } }) => {
        const achievementService = getContainer().services.achievements;
        return achievementService.adminUpdateTiers(payloads);
    });


export const postTriggerLongTasks = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { taskName: string })
    .handler(async ({ data: { taskName } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            const job = await mylistsLongTaskQueue.add(taskName, { triggeredBy: "dashboard" });
            return { success: true, jobId: job.id, message: "Task enqueued." };
        }
        catch (error) {
            throw new Error("Failed to enqueue task.");
        }
    });


export const getAdminJobOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            return mylistsLongTaskQueue.getJobCounts("wait", "active", "completed", "failed", "delayed", "paused");
        }
        catch (error) {
            throw new Error("Failed to fetch job counts.");
        }
    });


export const getAdminJobs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { types: string[]; start?: number; end?: number })
    .handler(async ({ data }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            const { types, start = 0, end = 19 } = data;
            const validTypes = types.filter((t) =>
                ["wait", "active", "completed", "failed", "delayed", "paused"].includes(t)
            ) as any[];

            if (!validTypes.length) {
                throw new Error("Invalid job types requested.");
            }

            const jobs = await mylistsLongTaskQueue.getJobs(validTypes, start, end, true);
            return jobs.map((job) => ({
                id: job.id,
                name: job.name,
                data: job.data,
                progress: job.progress,
                returnValue: job.returnvalue,
                failedReason: job.failedReason,
                timestamp: job.timestamp,
                processedOn: job.processedOn,
                finishedOn: job.finishedOn,
                attemptsMade: job.attemptsMade,
                stacktrace: job.stacktrace,
            }));
        }
        catch (error) {
            throw new Error("Failed to fetch jobs.");
        }
    });


export const getAdminJobLogs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as {
        end?: number,
        jobId: string,
        start?: number,
    })
    .handler(async ({ data }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            const { jobId, start = 0, end = 99 } = data;
            const logs = await mylistsLongTaskQueue.getJobLogs(jobId, start, end);
            return logs;
        }
        catch (error) {
            throw new Error("Failed to fetch job logs.");
        }
    });
