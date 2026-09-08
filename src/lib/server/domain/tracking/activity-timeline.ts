import type {MediaType} from "@/lib/utils/enums";
import type {MonthlyActivityChartDatum} from "@/lib/types/activity.types";


interface MonthlyActivityTimelineParams {
    endMonth: string;
    startMonth: string;
    mediaTypes: MediaType[];
    data: MonthlyActivityChartDatum[];
}


export const fillMonthlyActivityTimeline = ({ data, endMonth, mediaTypes, startMonth }: MonthlyActivityTimelineParams) => {
    const endDate = new Date(`${endMonth}-01T00:00:00.000Z`);
    const currentDate = new Date(`${startMonth}-01T00:00:00.000Z`);

    if (Number.isNaN(currentDate.getTime()) || Number.isNaN(endDate.getTime()) || currentDate > endDate) {
        return [];
    }

    const result: MonthlyActivityChartDatum[] = [];
    const byMonth = new Map(data.map(entry => [entry.month, entry]));

    while (currentDate <= endDate) {
        const month = `${currentDate.getUTCFullYear()}-${String(currentDate.getUTCMonth() + 1).padStart(2, "0")}`;
        result.push(byMonth.get(month) ?? {
            month,
            total: 0,
            ...Object.fromEntries(mediaTypes.map((mediaType) => [mediaType, 0])),
        } as MonthlyActivityChartDatum);

        currentDate.setUTCMonth(currentDate.getUTCMonth() + 1);
    }

    return result;
};
