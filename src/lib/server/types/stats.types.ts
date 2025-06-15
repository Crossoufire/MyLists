import {Status} from "@/lib/server/utils/enums";


export type DeltaStats = {
    views?: number;
    timeSpent?: number;
    totalRedo?: number;
    totalEntries?: number;
    entriesRated?: number;
    totalSpecific?: number;
    sumEntriesRated?: number;
    entriesCommented?: number;
    entriesFavorites?: number;
    statusCounts?: Partial<Record<Status, number>>;
};
