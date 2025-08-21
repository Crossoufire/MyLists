import {JobType} from "@/lib/server/utils/enums";
import {FilterConfig} from "@/lib/components/types";
import {getLangCountryName} from "@/lib/utils/functions";


export const getBooksActiveFilters = (): FilterConfig[] => {
    return [
        { key: "authors", title: "Authors", type: "search", job: JobType.CREATOR },
        {
            key: "langs", title: "Languages", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => getLangCountryName(name, "language"),
        },
    ];
}