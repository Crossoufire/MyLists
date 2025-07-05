import {JobType} from "@/lib/server/utils/enums";
import {FilterConfig} from "@/lib/components/types";


export const getGamesActiveFilters = (): FilterConfig[] => {
    return [
        { key: "companies", title: "Companies", type: "search", job: JobType.CREATOR },
        {
            key: "platforms", title: "Platforms", type: "checkbox",
            getItems: (data) => data.platforms,
        },
    ];
}
