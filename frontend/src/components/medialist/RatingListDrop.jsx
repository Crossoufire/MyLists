import {useState} from "react";
import {LuStar} from "react-icons/lu";
import {useMutation} from "@/hooks/LoadingHook";
import {getFeelingValues, getScoreValues} from "@/lib/utils";
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


export const RatingListDrop = ({ isCurrent, initRating, updateRating }) => {
    const [isLoading, handleLoading] = useMutation();
    const [rating, setRating] = useState(initRating);

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

    const handleSelectChange = async (value) => {
        const newVal = value;
        const response = await handleLoading(updateRating, newVal);
        if (response) {
            setRating({ ...rating, value: newVal });
        }
    };

    return (
        <div className="flex items-center gap-2" title="Rating">
            <LuStar/>
            {isCurrent ?
                <SelectDrop
                    items={selectItems}
                    rating={rating.value}
                    isLoading={isLoading}
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
