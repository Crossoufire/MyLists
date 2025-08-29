import {JobType} from "@/lib/server/utils/enums";
import {SheetFilterObject} from "@/lib/types/base.types";


export const getMangaActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "authors", title: "Authors", type: "search", job: JobType.CREATOR },
        { key: "publishers", title: "Publishers", type: "search", job: JobType.PUBLISHER },
    ];
}
