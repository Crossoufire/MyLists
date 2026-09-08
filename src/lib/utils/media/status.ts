import {Status} from "@/lib/utils/enums";


export const getPlanningStatuses = (): Status[] => [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ];


export const canShowProgress = (status: Status) => {
    return ![...getPlanningStatuses(), Status.RANDOM].some(progresslessStatus => progresslessStatus === status);
}
