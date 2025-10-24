import {jobHistory} from "@/lib/server/database/schema";
import {FormattedError} from "@/lib/utils/error-classes";
import {createServerOnlyFn} from "@tanstack/react-start";
import {getDbClient} from "@/lib/server/database/async-storage";
import {TaskReturnType, TypedJob} from "@/lib/types/tasks.types";


export const getQueue = createServerOnlyFn(() => async () => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");
    const { mylistsTaskQueue, initializeQueue } = await import("@/lib/server/core/bullmq");

    if (mylistsTaskQueue) {
        return mylistsTaskQueue;
    }

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new FormattedError("Could not connect to Redis for queue operations.");
    }

    return initializeQueue(redisConnection);
})();


const getCancelKey = (jobId: string) => {
    return `mylists-cancel:${jobId}`;
};


export const signalJobCancellation = async (jobId: string) => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new Error("Failed to connect to Redis.");
    }

    await redisConnection.set(getCancelKey(jobId), "1", "EX", 3600);
};


export const isJobCancelled = async (jobId: string) => {
    const { connectRedis } = await import("@/lib/server/core/redis-client");

    const redisConnection = await connectRedis();
    if (!redisConnection) {
        throw new Error("Failed to connect to Redis.");
    }

    const result = await redisConnection.get(getCancelKey(jobId));

    return result === "1";
};


export const saveJobToDb = async (job: TypedJob | undefined, from: "completed" | "failed", returnValue?: TaskReturnType) => {
    try {
        if (!job) return;

        const status = returnValue?.result ?? from === "completed" ? "completed" : "failed";

        await getDbClient()
            .insert(jobHistory)
            .values({
                id: job.id!,
                data: job.data,
                status: status,
                name: job.name,
                timestamp: job.timestamp,
                finishedOn: job.finishedOn,
                processedOn: job.processedOn,
                returnValue: returnValue ?? null,
                triggeredBy: job.data.triggeredBy,
                failedReason: job.failedReason ?? null,
                userId: "userId" in job.data ? job.data.userId : null,
            });

        await job.remove();
    }
    catch (err) {
        console.error("Failed to save job to database:", err);
    }
}
