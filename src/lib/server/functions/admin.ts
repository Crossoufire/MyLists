import EventEmitter from "events";
import {serverEnv} from "@/env/server";
import {redirect} from "@tanstack/react-router";
import {createServerFn} from "@tanstack/react-start";
import {getContainer} from "@/lib/server/core/container";
import {FormattedError} from "@/lib/utils/error-classes";
import {JobType as MqJobType, QueueEvents} from "bullmq";
import {getCookie, getRequest, setCookie} from "@tanstack/react-start/server";
import {taskDefinitions} from "@/lib/server/domain/tasks/tasks-config";
import {createAdminToken, verifyAdminToken} from "@/lib/utils/jwt-utils";
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


const ADMIN_COOKIE_OPTIONS = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    maxAge: serverEnv.ADMIN_VALID_COOKIE_TIME * 60 * 1000,
    path: "/"
};


const getQueue = async () => {
    if (process.env.NODE_ENV !== "production") {
        return null;
    }

    const { connectRedis } = await import("@/lib/server/core/redis-client");
    const { mylistsLongTaskQueue, initializeQueue } = await import("@/lib/server/core/bullmq");

    if (mylistsLongTaskQueue) {
        return mylistsLongTaskQueue;
    }

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new FormattedError("Could not connect to Redis for queue operations.");
    }

    return initializeQueue(redisConnection);
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
            setCookie(ADMIN_COOKIE_NAME, adminToken, ADMIN_COOKIE_OPTIONS);

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
        setCookie(ADMIN_COOKIE_NAME, "", { ...ADMIN_COOKIE_OPTIONS, maxAge: 0 });
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
    .handler(async () => taskDefinitions);


export const postTriggerLongTasks = createServerFn({ method: "POST" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(postTriggerLongTasksSchema)
    .handler(async ({ data: { taskName } }) => {
        const mylistsLongTaskQueue = await getQueue();

        if (!mylistsLongTaskQueue) {
            return {
                success: true,
                jobId: "dev-mode-job",
                message: "Tasks are disabled in development mode.",
            };
        }

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
        const mylistsLongTaskQueue = await getQueue();

        if (!mylistsLongTaskQueue) {
            return [];
        }

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


export const streamAdminJobs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .handler(async function* () {
        const queue = await getQueue();
        if (!queue) {
            yield [];
            return;
        }

        const getJobs = async () => {
            const types: MqJobType[] = ["wait", "active"];
            const jobs = await queue.getJobs(types);
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
                status: job.failedReason ? "failed" : job.finishedOn ? "completed" : job.processedOn ? "active" : "waiting"
            }));
        };

        try {
            yield await getJobs();
        }
        catch (err) {
            console.error("Failed to get initial jobs", err);
            yield [];
        }

        const request = getRequest();
        const signal = request.signal;
        const events = new EventEmitter();
        const client = await queue.client;
        const queueEvents = new QueueEvents(queue.name, { connection: client.duplicate() });
        const eventNames = ["active", "completed", "failed", "progress", "removed", "waiting", "added"] as const;

        const listener = () => events.emit("update");
        eventNames.forEach((name) => queueEvents.on(name, listener));

        const cleanup = () => {
            eventNames.forEach((name) => queueEvents.off(name, listener));
            queueEvents.close();
        };

        signal.addEventListener("abort", cleanup, { once: true });

        try {
            yield await getJobs();

            while (!signal.aborted) {
                await new Promise((res) => events.once("update", res));
                if (signal.aborted) break;

                try {
                    yield await getJobs();
                }
                catch (err) {
                    console.error("Failed to get jobs on update", err);
                }
            }
        }
        catch (err) {
            console.error("Stream error", err);
        }
        finally {
            cleanup();
        }
    });


export const getAdminJobLogs = createServerFn({ method: "GET" })
    .middleware([managerAuthMiddleware, adminAuthMiddleware])
    .inputValidator(getAdminJobSchema)
    .handler(async ({ data: { jobId } }) => {
        const mylistsLongTaskQueue = await getQueue();

        if (!mylistsLongTaskQueue) {
            return { count: 1, logs: ["Job logging is disabled in dev mode."] };
        }

        try {
            return mylistsLongTaskQueue.getJobLogs(jobId);
        }
        catch {
            throw new FormattedError("Failed to fetch job logs.");
        }
    });
