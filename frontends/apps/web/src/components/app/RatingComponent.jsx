import {getFeelingIcon, getFeelingList, getScoreList} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RatingComponent = ({ rating, onUpdate }) => {
    const ratingList = (rating.type === "score") ? getScoreList() : getFeelingList(16);
    const ratingValue = (rating.type === "score") ? rating.value : getFeelingIcon(rating.value, { valueOnly: true });

    const handleSelectChange = (value) => {
        onUpdate.mutate({ payload: value });
    };

    return (
        <div className="flex justify-between items-center">
            <Select value={ratingValue} onValueChange={handleSelectChange} disabled={onUpdate.isPending}>
                <SelectTrigger className="w-[130px]" size="details">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {ratingList.map(rating =>
                        <SelectItem key={rating.value} value={rating.value}>
                            {rating.component}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
