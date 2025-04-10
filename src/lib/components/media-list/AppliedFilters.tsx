import {X} from "lucide-react";
import {Badge} from "@/lib/components/ui/badge";
import {capitalize} from "@/lib/utils/functions";
import {MutedText} from "@/lib/components/app/MutedText";
import {useParams, useSearch} from "@tanstack/react-router";


interface AppliedFiltersProps {
    totalItems: number;
    onFilterRemove: any;
}


export const AppliedFilters = ({ totalItems, onFilterRemove }: AppliedFiltersProps) => {
    const search = useSearch({ from: "/_private/list/$mediaType/$username" });
    const { mediaType } = useParams({ from: "/_private/list/$mediaType/$username" });
    const localFilters = { ...search };
    delete localFilters.page;
    delete localFilters.sort;

    const removeFilter = (filterKey: string, filterValue: any) => {
        //@ts-expect-error
        onFilterRemove({ [filterKey]: Array.isArray(localFilters[filterKey]) ? [filterValue] : null });
    };

    const removeAllFilters = () => {
        const resetFilters = Object.keys(localFilters).reduce((acc, key) => {
            //@ts-expect-error
            if (Array.isArray(localFilters[key])) {
                //@ts-expect-error
                acc[key] = [];
            }
            else {
                //@ts-expect-error
                acc[key] = null;
            }
            return acc;
        }, {});
        onFilterRemove(resetFilters);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-8">
            <MutedText className="not-italic">{totalItems} {capitalize(mediaType)}</MutedText>
            {Object.keys(localFilters).length > 0 && <MutedText className="not-italic mr-2">|</MutedText>}
            <>
                {Object.entries(localFilters).map(([key, value]) =>
                    Array.isArray(value) ?
                        value.map(val =>
                            <Badge key={`${key}-${val}`} className="h-8 px-4 text-sm gap-2" variant="secondary">
                                {val}
                                <div role="button" className="hover:opacity-80 -mr-1" onClick={() => removeFilter(key, val)}>
                                    <X className="w-4 h-4"/>
                                </div>
                            </Badge>,
                        )
                        :
                        <Badge key={key} className="h-8 px-4 text-sm gap-2" variant="secondary">
                            {(key === "common" && value === true) ? `No common` :
                                (key === "favorite" && value === true) ? `Favorites` :
                                    (key === "comment" && value === true) ? `Commented` :
                                        value as string
                            }
                            <div role="button" className="hover:opacity-80 -mr-1"
                                 onClick={() => removeFilter(key, value)}>
                                <X className="w-4 h-4"/>
                            </div>
                        </Badge>,
                )}
                {Object.keys(localFilters).length > 0 &&
                    <div role="button" className="ml-2" onClick={() => removeAllFilters()}>
                        <MutedText className="not-italic">Clear All</MutedText>
                    </div>
                }
            </>
        </div>
    );
};