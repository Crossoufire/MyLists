import {JobType, Queue} from "bullmq";
import {rootLogger} from "@/lib/server/core/logger";
import {executeTask} from "@/lib/server/core/task-runner";
import {TaskJobData, TaskName, TaskReturnType} from "@/lib/types/tasks.types";


export const createDummyQueue = () => {
    const dummyQueue = {
        add: async (taskName: TaskName, data: TaskJobData) => {
            rootLogger.info({ taskName, data }, "Dummy queue received task.");
            await executeTask({ data, taskName, triggeredBy: data.triggeredBy }, rootLogger);
            return Promise.resolve({ id: "dummy-job-id" });
        },
        getJob: async (_jobId: string) => {
        },
        getJobs: async (_types?: JobType[] | JobType) => [],
        close: async () => {
        },
        getJobsLogs: async (_jobId: string) => ({ logs: [] as string[], count: 0 }),
    } as unknown as Queue<TaskJobData, TaskReturnType, TaskName>;

    return dummyQueue;
}
