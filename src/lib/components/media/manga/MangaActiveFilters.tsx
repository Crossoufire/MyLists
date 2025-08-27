import {JobType} from "@/lib/server/utils/enums";
import {FilterConfig} from "@/lib/components/types";


export const getMangaActiveFilters = (): FilterConfig[] => {
    return [
        { key: "authors", title: "Authors", type: "search", job: JobType.CREATOR },
        { key: "publishers", title: "Publishers", type: "search", job: JobType.PUBLISHER },
    ];
}
