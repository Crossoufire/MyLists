import {getFeelingValues, getScoreValues} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RatingDrop = ({ rating, updateRating }) => {
    let selectItems;
    if (rating.type === "feeling") {
        selectItems = getFeelingValues(16).map(val =>
            <SelectItem key={val.value} value={val.value}>
                {val.icon}
            </SelectItem>
        );
    }
    else {
        selectItems = getScoreValues().map(val =>
            <SelectItem key={val} value={val}>
                {typeof val === "number" ? val.toFixed(1) : "--"}
            </SelectItem>
        );
    }

    const handleSelectChange = (rating) => {
        updateRating.mutate({ payload: rating });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Rating</div>
            <Select value={rating.value} onValueChange={handleSelectChange} disabled={updateRating.isPending}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {selectItems}
                </SelectContent>
            </Select>
        </div>
    );
};
