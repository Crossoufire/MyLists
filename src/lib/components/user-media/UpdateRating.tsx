import {getFeelingIcon, getFeelingList, getScoreList} from "@/lib/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface RatingComponentProps {
    rating: any;
    onUpdate?: any;
}


export const UpdateRating = ({ rating, onUpdate }: RatingComponentProps) => {
    const ratingList = (rating?.type === "score") ? getScoreList() : getFeelingList({ size: 16 });
    const ratingValue = (rating?.type === "score") ? rating.value : getFeelingIcon(rating.value, { valueOnly: true });

    const handleSelectChange = (value: string) => {
        onUpdate.mutate({ payload: value });
    };

    return (
        <div className="flex justify-between items-center">
            <Select value={ratingValue} onValueChange={handleSelectChange} disabled={onUpdate?.isPending}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent>
                    {ratingList.map(rating =>
                        <SelectItem key={rating.value} value={rating?.value?.toString() ?? "0"}>
                            {rating.component}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
