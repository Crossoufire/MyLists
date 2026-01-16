import {JobType} from "@/lib/utils/enums";
import {formatLocaleName} from "@/lib/utils/formating";
import {SheetFilterObject} from "@/lib/types/base.types";


export const getBooksActiveFilters = (): SheetFilterObject[] => {
    return [
        { key: "authors", title: "Authors", type: "search", job: JobType.CREATOR },
        {
            key: "langs", title: "Languages", type: "checkbox",
            getItems: (data) => data.langs,
            render: (name) => formatLocaleName(name, "language"),
        },
    ];
}
