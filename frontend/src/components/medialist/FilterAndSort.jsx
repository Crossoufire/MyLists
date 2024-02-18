import {FilterSortDrop} from "@/components/medialist/FilterSortDrop";


export const FilterAndSort = ({ mediaType, paginateData, updateLang, updateGenre, updateSorting }) => {
    return (
        <div className="flex items-center -mb-1">
            {mediaType === "movies" &&
                <FilterSortDrop
                    name="Lang"
                    activeData={paginateData.lang}
                    allData={["All", "en", "fr"]}
                    updateFunction={updateLang}
                />
            }
            <FilterSortDrop
                name="Genres"
                activeData={paginateData.genre}
                allData={paginateData.all_genres}
                updateFunction={updateGenre}
            />
            <FilterSortDrop
                name="Sort"
                activeData={paginateData.sorting}
                allData={paginateData.all_sorting}
                updateFunction={updateSorting}
            />
        </div>
    );
};
