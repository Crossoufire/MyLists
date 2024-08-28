import {useMutation} from "@/hooks/LoadingHook";
import {getFeelingValues, getScoreValues} from "@/lib/utils";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RatingDrop = ({ rating, updateRating, callbackRating }) => {
    const [isLoading, handleLoading] = useMutation();

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

    const handleSelectChange = async (value) => {
        const response = await handleLoading(updateRating, value);
        if (response) {
            callbackRating(value);
        }
    };

    return (
        <div className="flex justify-between items-center">
            <div>Rating</div>
            <Select value={rating.value} onValueChange={handleSelectChange} disabled={isLoading}>
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
