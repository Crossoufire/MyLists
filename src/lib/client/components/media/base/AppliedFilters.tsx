import {X} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {Badge} from "@/lib/client/components/ui/badge";
import {MediaListArgs} from "@/lib/types/zod.schema.types";
import {useParams, useSearch} from "@tanstack/react-router";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {capitalize, getLangCountryName} from "@/lib/utils/functions";


interface AppliedFiltersProps {
    totalItems: number;
    onFilterRemove: (filters: Partial<MediaListArgs>) => void;
}


export const AppliedFilters = ({ totalItems, onFilterRemove }: AppliedFiltersProps) => {
    const { mediaType } = useParams({ from: "/_main/_private/list/$mediaType/$username" });
    const { page: _page, sort: _sort, ...rawFilters } = useSearch({ from: "/_main/_private/list/$mediaType/$username" });

    const localFilters = rawFilters as Partial<MediaListArgs>;

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
            <MutedText italic={false}>
                {totalItems} {capitalize(mediaType)}
            </MutedText>
            {Object.keys(localFilters).length > 0 &&
                <div className="text-muted-foreground ml-2 mr-2">|</div>
            }
            <>
                {Object.entries(localFilters).map(([key, value]) =>
                    Array.isArray(value) ?
                        value.map((item) =>
                            <Badge key={`${key}-${item}`} className="h-8 px-4 text-sm gap-2" variant="secondary">
                                {key === "langs" ?
                                    getLangCountryName(
                                        item,
                                        (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) ? "region" : "language",
                                    )
                                    :
                                    item
                                }
                                <div
                                    role="button"
                                    className="hover:opacity-80 -mr-1"
                                    onClick={() => removeFilter(key as keyof MediaListArgs, item)}
                                >
                                    <X className="size-4"/>
                                </div>
                            </Badge>
                        )
                        :
                        // TODO: Not typesafe
                        <Badge key={key} className="h-8 px-4 text-sm gap-2" variant="secondary">
                            {(key === "hideCommon" && value === true) ? `No common` :
                                (key === "favorite" && value === true) ? `Favorites` :
                                    (key === "comment" && value === true) ? `Commented` :
                                        value as string
                            }
                            <div role="button" className="hover:opacity-80 -mr-1" onClick={() => removeFilter(key as keyof MediaListArgs, value)}>
                                <X className="size-4"/>
                            </div>
                        </Badge>
                )}
                {Object.keys(localFilters).length > 0 &&
                    <div role="button" className="ml-2" onClick={() => removeAllFilters()}>
                        <MutedText italic={false}>
                            Clear All
                        </MutedText>
                    </div>
                }
            </>
        </div>
    );
};
