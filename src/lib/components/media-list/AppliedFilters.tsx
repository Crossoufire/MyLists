import {X} from "lucide-react";
import {Badge} from "@/lib/components/ui/badge";
import {capitalize} from "@/lib/utils/functions";
import {MutedText} from "@/lib/components/app/MutedText";
import {useParams, useSearch} from "@tanstack/react-router";
import {MediaListArgs} from "@/lib/server/types/base.types";


interface AppliedFiltersProps {
    totalItems: number;
    onFilterRemove: (filters: Partial<MediaListArgs>) => void;
}


export const AppliedFilters = ({ totalItems, onFilterRemove }: AppliedFiltersProps) => {
    const search = useSearch({ from: "/_private/list/$mediaType/$username" });
    const { mediaType } = useParams({ from: "/_private/list/$mediaType/$username" });

    const localFilters = { ...search };
    delete localFilters.page;
    delete localFilters.sort;

    const removeFilter = <K extends keyof MediaListArgs>(filterKey: K, filterValue: any) => {
        onFilterRemove({ [filterKey]: Array.isArray(localFilters[filterKey]) ? [filterValue] : null });
    };

    const removeAllFilters = () => {
        const resetFilters = Object.keys(localFilters).reduce<Partial<MediaListArgs>>((acc, key) => {
            const typedKey = key as keyof MediaListArgs;

            if (Array.isArray(localFilters[typedKey])) {
                acc[typedKey] = [] as any;
            }
            else {
                acc[typedKey] = undefined;
            }
            return acc;
        }, {});

        onFilterRemove(resetFilters);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-8">
            <MutedText className="not-italic">
                {totalItems} {capitalize(mediaType)}
            </MutedText>
            {Object.keys(localFilters).length > 0 &&
                <MutedText className="not-italic mr-2">|</MutedText>
            }
            <>
                {Object.entries(localFilters).map(([key, value]) =>
                    Array.isArray(value) ?
                        value.map(val =>
                            <Badge key={`${key}-${val}`} className="h-8 px-4 text-sm gap-2" variant="secondary">
                                {val}
                                <div
                                    role="button"
                                    className="hover:opacity-80 -mr-1"
                                    onClick={() => removeFilter(key as keyof MediaListArgs, val)}
                                >
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
                            <div
                                role="button"
                                className="hover:opacity-80 -mr-1"
                                onClick={() => removeFilter(key as keyof MediaListArgs, value)}
                            >
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