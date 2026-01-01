import {JobType} from "@/lib/utils/enums";
import {SheetFilterObject} from "@/lib/types/base.types";

import {formatLocaleName} from "@/lib/utils/formating";


export const getBooksActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "authors", title: "Authors", type: "search", job: JobType.CREATOR },
        {
            key: "langs", title: "Languages", type: "checkbox",
            getItems: (data) => data.langs,
            renderLabel: (name) => formatLocaleName(name, "language"),
        },
    ];
}
