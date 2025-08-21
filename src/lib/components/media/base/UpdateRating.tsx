import {RatingSystemType, UpdateType} from "@/lib/server/utils/enums";
import {getFeelingIcon, getFeelingList, getScoreList} from "@/lib/utils/functions";
import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface RatingComponentProps {
    rating: number | null;
    ratingSystem: RatingSystemType;
    onUpdateMutation: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdateRating = ({ rating, ratingSystem, onUpdateMutation }: RatingComponentProps) => {
    const ratingList = (ratingSystem === RatingSystemType.SCORE) ? getScoreList() : getFeelingList({ size: 16 });
    const ratingValue = (ratingSystem === RatingSystemType.SCORE) ? rating : getFeelingIcon(rating, { valueOnly: true });

    const handleSelectChange = (value: string) => {
        const valueToSend = value === "--" ? null : parseFloat(value);
        onUpdateMutation.mutate({ payload: { rating: valueToSend, type: UpdateType.RATING } });
    };

    return (
        <div className="flex justify-between items-center">
            <Select value={ratingValue?.toString() ?? "--"} onValueChange={handleSelectChange} disabled={onUpdateMutation?.isPending}>
                <SelectTrigger className="w-[130px]">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent className="max-h-[300px] overflow-y-auto">
                    {ratingList.map((rating) =>
                        <SelectItem key={rating.value} value={rating.value?.toString() ?? "--"}>
                            {rating.component}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
