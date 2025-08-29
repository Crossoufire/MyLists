import {JobType} from "@/lib/server/utils/enums";
import {getLangCountryName} from "@/lib/utils/functions";
import {SheetFilterObject} from "@/lib/types/base.types";


export const getBooksActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "authors", title: "Authors", type: "search", job: JobType.CREATOR },
        {
            key: "langs", title: "Languages", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => getLangCountryName(name, "language"),
        },
    ];
}
