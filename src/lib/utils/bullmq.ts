import {sql} from "drizzle-orm";
import {serverEnv} from "@/env/server";
import {jobHistory} from "@/lib/server/database/schema";
import {createOrGetQueue} from "@/lib/server/core/bullmq";
import {getDbClient} from "@/lib/server/database/async-storage";
import {TaskReturnType, TypedJob} from "@/lib/types/tasks.types";
import {getRedisConnection} from "@/lib/server/core/redis-client";


const getCancelKey = (jobId: string) => {
    return `mylists-cancel:${jobId}`;
};


export const signalJobCancellation = async (jobId: string) => {
    if (!serverEnv.REDIS_ENABLED) return;
    const connection = await getRedisConnection()
    await connection.set(getCancelKey(jobId), "1", "EX", 3600);
};


export const isJobCancelled = async (jobId: string) => {
    if (!serverEnv.REDIS_ENABLED) return false;
    const connection = await getRedisConnection();
    const result = await connection.get(getCancelKey(jobId));

    return result === "1";
};


export const saveJobToDb = async (job: TypedJob | undefined, from: "completed" | "failed", returnValue?: TaskReturnType) => {
    try {
        if (!job) return;

        const queue = await createOrGetQueue();
        const logs = await queue.getJobLogs(job.id!);
        const status = from === "failed" ? "failed" : returnValue?.result === "cancelled" ? "cancelled" : "completed";

        await getDbClient()
            .insert(jobHistory)
            .values({
                logs: logs,
                jobId: job.id!,
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

        await getDbClient().run(sql`PRAGMA wal_checkpoint(FULL)`);
        await job.remove();
    }
    catch (err) {
        console.error("Failed to save job to database:", err);
    }
}
