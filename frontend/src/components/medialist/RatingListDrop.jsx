import {useState} from "react";
import {getRatingValues} from "@/lib/utils";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RatingListDrop = ({ isCurrent, isFeeling, initRating, updateRating }) => {
    const [isLoading, handleLoading] = useLoading();
    const [rating, setRating] = useState(initRating);
    const ratingValues = getRatingValues(isFeeling, 16);

    const handleSelectChange = async (value) => {
        const newVal = value;
        const response = await handleLoading(updateRating, newVal);

        if (response) {
            setRating(newVal);
        }
    };

    return (
        <>
            {isCurrent ?
                isFeeling ?
                    <Select value={isLoading ? undefined : `${rating}`} onValueChange={handleSelectChange} disabled={isLoading}>
                        <Tooltip text="Rating" offset={4}>
                            <SelectTrigger className="w-[50px]" size="list" variant="noIcon">
                                <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                            </SelectTrigger>
                        </Tooltip>
                        <SelectContent align="center">
                            {ratingValues.map(val =>
                                <SelectItem key={val.value} value={`${val.value}`}>{val.icon}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    :
                    <Select value={isLoading ? undefined : rating} onValueChange={handleSelectChange} disabled={isLoading}>
                        <Tooltip text="Rating" offset={4}>
                            <SelectTrigger className="w-[50px]" size="list" variant="noIcon">
                                <SelectValue placeholder={<LoadingIcon size={6}/>}/>
                            </SelectTrigger>
                        </Tooltip>
                        <SelectContent align="center">
                            {ratingValues.map(val =>
                                <SelectItem key={val} value={val}>
                                    {typeof val === "number" ? val.toFixed(1) : "---"}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                :
                <Tooltip text="Rating" offset={4}>
                    {isFeeling ?
                        <span>{ratingValues.filter(r => r.value === rating)[0].icon}</span>
                        :
                        <span>{typeof rating === "number" ? rating.toFixed(1) : "---"}</span>
                    }
                </Tooltip>
            }
        </>
    )
};
