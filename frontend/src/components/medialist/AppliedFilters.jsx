import {LuX} from "react-icons/lu";
import {capitalize} from "@/lib/utils";
import {Badge} from "@/components/ui/badge";
import {MutedText} from "@/components/app/base/MutedText";
import {Route} from "@/routes/_private/list/$mediaType.$username.jsx";



export const AppliedFilters = ({ total, onFilterRemove }) => {
    const search = Route.useSearch();
    const localFilters = { ...search };
    const { mediaType } = Route.useParams();
    delete localFilters.page;
    delete localFilters.sort;

    const handleRemoveAFilter = (filterKey, filterValue) => {
        if (Array.isArray(localFilters[filterKey])) {
            onFilterRemove({ [filterKey]: [filterValue] });
        }
        else {
            onFilterRemove({ [filterKey]: null });
        }
    };

    const handleRemoveAllFilters = () => {
        const resetFilters = Object.keys(localFilters).reduce((acc, key) => {
            if (Array.isArray(localFilters[key])) {
                acc[key] = [];
            }
            else {
                acc[key] = null;
            }
            return acc;
        }, {});
        onFilterRemove(resetFilters);
    };

    return (
        <div className="flex flex-wrap items-center gap-2 mb-8">
            <MutedText className="not-italic">{total} {capitalize(mediaType)}</MutedText>
            {Object.keys(localFilters).length > 0 &&
                <MutedText className="not-italic mr-2">|</MutedText>
            }
            <>
                {Object.entries(localFilters).map(([key, value]) =>
                    Array.isArray(value) ?
                        value.map(val =>
                            <Badge key={`${key}-${val}`} className="h-8 px-4 text-sm gap-2" variant="secondary">
                                {val}
                                <div role="button" className="hover:opacity-80 -mr-1" onClick={() => handleRemoveAFilter(key, val)}>
                                    <LuX/>
                                </div>
                            </Badge>
                        )
                        :
                        <Badge key={key} className="h-8 px-4 text-sm gap-2" variant="secondary">
                            {(key === "common" && value === true) ? `No common` :
                                (key === "favorite" && value === true) ? `Favorites` :
                                    (key === "comment" && value === true) ? `Commented` :
                                        value
                            }
                            <div role="button" className="hover:opacity-80 -mr-1"
                                 onClick={() => handleRemoveAFilter(key, value)}>
                                <LuX/>
                            </div>
                        </Badge>
                )}
                {Object.keys(localFilters).length > 0 &&
                    <div role="button" className="ml-2" onClick={() => handleRemoveAllFilters(localFilters)}>
                        <MutedText className="not-italic">Clear All</MutedText>
                    </div>
                }
            </>
        </div>
    );
};