import {getRatingValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RatingDrop = ({ isFeeling, rating, updateRating, callbackRating }) => {
    const [isLoading, handleLoading] = useLoading();
    const ratingValues = getRatingValues(isFeeling, 16);

    const handleSelectChange = async (value) => {
        const response = await handleLoading(updateRating, value);
        if (response) {
            callbackRating(value);
        }
    };

    return (
        <>
            {isFeeling ?
                <div className="flex justify-between items-center">
                    <div>Rating</div>
                    <Select value={isLoading ? undefined : `${rating}`} onValueChange={handleSelectChange}
                            disabled={isLoading}>
                        <SelectTrigger className="w-[130px]" size="details">
                            <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                        </SelectTrigger>
                        <SelectContent>
                            {ratingValues.map(val =>
                                <SelectItem key={val} value={`${val.value}`}>
                                    {val.icon}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
                :
                <div className="flex justify-between items-center">
                    <div>Rating</div>
                    <Select value={isLoading ? undefined : rating} onValueChange={handleSelectChange}
                            disabled={isLoading}>
                        <SelectTrigger className="w-[130px]" size="details">
                            <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                        </SelectTrigger>
                        <SelectContent>
                            {ratingValues.map(val =>
                                <SelectItem key={val} value={val}>
                                    {typeof val === "number" ? val.toFixed(1) : "---"}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                </div>
            }
        </>
    )
};
