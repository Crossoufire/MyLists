import {LuStar} from "react-icons/lu";
import {getFeelingValues, getScoreValues} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


const SelectDrop = ({ isLoading, rating, handleSelectChange, items }) => {
    return (
        <Select value={rating} onValueChange={handleSelectChange} disabled={isLoading}>
            <SelectTrigger className="w-[30px]" size="list" variant="noIcon" title="Rating">
                <SelectValue/>
            </SelectTrigger>
            <SelectContent align="center">
                {items}
            </SelectContent>
        </Select>
    );
};


export const RatingListDrop = ({ isCurrent, rating, updateRating }) => {
    let ratingValues, selectItems;
    if (rating.type === "feeling") {
        ratingValues = getFeelingValues(16);
        selectItems = ratingValues.map(val =>
            <SelectItem key={val.value} value={val.value}>
                {val.icon}
            </SelectItem>
        );
    }
    else {
        ratingValues = getScoreValues();
        selectItems = ratingValues.map(val =>
            <SelectItem key={val} value={val}>
                {typeof val === "number" ? val.toFixed(1) : "--"}
            </SelectItem>
        );
    }

    const handleSelectChange = async (rating) => {
        await updateRating.mutateAsync({ payload: rating });
    };

    return (
        <div className="flex items-center gap-2" title="Rating">
            <LuStar/>
            {isCurrent ?
                <SelectDrop
                    items={selectItems}
                    rating={rating.value}
                    isLoading={updateRating.isPending}
                    handleSelectChange={handleSelectChange}
                />
                :
                (rating.type === "feeling") ?
                    <span title="Rating">
                        {ratingValues.filter(r => r.value === rating.value)[0].icon}
                    </span>
                    :
                    <span title="Rating">
                        {typeof rating.value === "number" ? rating.value.toFixed(1) : "--"}
                    </span>
            }
        </div>
    );
};
