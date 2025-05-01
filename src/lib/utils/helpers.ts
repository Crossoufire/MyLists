import {twMerge} from "tailwind-merge";
import {type ClassValue, clsx} from "clsx";


export const mail = "contact.us.at.mylists@gmail.com";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


export function deriveMQJobStatus(job: any) {
    if (job.failedReason) return "failed";
    if (job.finishedOn) return "completed";
    if (job.processedOn) return "active";
    if (job.timestamp) return "waiting";
    return "unknown";
}
