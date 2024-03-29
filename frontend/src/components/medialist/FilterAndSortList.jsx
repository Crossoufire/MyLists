import {useParams} from "react-router-dom";
import {FilterSortDropList} from "@/components/medialist/FilterSortDropList.jsx";


export const FilterAndSortList = ({ paginateData, updateLang, updateGenre, updateSorting }) => {
    const { mediaType } = useParams();

    if (["Stats", "Labels"].includes(paginateData.status)) {
        return null;
    }

    return (
        <div className="flex items-center -mb-1">
            {mediaType === "movies" &&
                <FilterSortDropList
                    name="Lang"
                    activeData={paginateData.lang}
                    allData={["All", "en", "fr"]}
                    updateFunction={updateLang}
                />
            }
            <FilterSortDropList
                name="Genre"
                activeData={paginateData.genre}
                allData={paginateData.all_genres}
                updateFunction={updateGenre}
            />
            <FilterSortDropList
                name="Sorting"
                activeData={paginateData.sorting}
                allData={paginateData.all_sorting}
                updateFunction={updateSorting}
            />
        </div>
    );
};
