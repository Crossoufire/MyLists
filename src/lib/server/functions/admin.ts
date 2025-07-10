import {JobType} from "bullmq";
import {createServerFn} from "@tanstack/react-start";
import {deriveMQJobStatus} from "@/lib/utils/helpers";
import {getContainer} from "@/lib/server/core/container";
import {taskDefinitions, TasksName} from "@/cli/commands";
import {managerAuthMiddleware} from "@/lib/server/middlewares/authentication";
import {AdminPaginatedUsers} from "@/lib/server/domain/user/repositories/user.repository";
import {FormattedError} from "@/lib/server/utils/error-classes";


export const getAdminOverview = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getAdminOverview();
    });


export const getAdminAllUsers = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as AdminPaginatedUsers)
    .handler(async ({ data }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.getAdminPaginatedUsers(data);
    });


export const getAdminAchievements = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.allUsersAchievements();
    });


export const getAdminMediadleStats = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data)
    .handler(async ({ data }) => {
        const mediadleService = await getContainer().then((c) => c.services.mediadle);
        return mediadleService.getAdminAllUsersStats(data);
    });


export const postAdminUpdateUser = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { userId: number, payload: Record<string, any> })
    .handler(async ({ data: { userId, payload } }) => {
        const userService = await getContainer().then((c) => c.services.user);
        return userService.adminUpdateUser(userId, payload);
    });


export const postAdminUpdateAchievement = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as {
        achievementId: number,
        payload: Record<string, any>,
    })
    .handler(async ({ data: { achievementId, payload } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.adminUpdateAchievement(achievementId, payload);
    });


export const postAdminUpdateTiers = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as {
        payloads: Record<string, any>[],
    })
    .handler(async ({ data: { payloads } }) => {
        const achievementService = await getContainer().then((c) => c.services.achievements);
        return achievementService.adminUpdateTiers(payloads);
    });


export const getAdminTasks = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .handler(async () => {
        return taskDefinitions;
    });


export const postTriggerLongTasks = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { taskName: TasksName })
    .handler(async ({ data: { taskName } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            const job = await mylistsLongTaskQueue.add(taskName, { triggeredBy: "dashboard" });
            return { success: true, jobId: job.id, message: "Task enqueued." };
        }
        catch (error) {
            throw new FormattedError("Failed to enqueue task.");
        }
    });


export const getAdminJobs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { types: JobType[] })
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
            throw new FormattedError("Failed to fetch jobs.");
        }
    });


export const getAdminJobLogs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware])
    .validator((data: any) => data as { jobId: string })
    .handler(async ({ data: { jobId } }) => {
        const { mylistsLongTaskQueue } = await import("@/lib/server/core/bullMQ-queue");

        try {
            return mylistsLongTaskQueue.getJobLogs(jobId);
        }
        catch (error) {
            throw new FormattedError("Failed to fetch job logs.");
        }
    });



