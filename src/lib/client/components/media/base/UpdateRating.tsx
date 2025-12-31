import {useAuth} from "@/lib/client/hooks/use-auth";
import {RatingSystemType, UpdateType} from "@/lib/utils/enums";
import {getFeelingIcon, getFeelingList, getScoreList} from "@/lib/utils/functions";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface RatingComponentProps {
    rating: number | null;
    onUpdateMutation: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdateRating = ({ rating, onUpdateMutation }: RatingComponentProps) => {
    const { currentUser } = useAuth();
    const ratingList = (currentUser?.ratingSystem === RatingSystemType.SCORE) ? getScoreList() : getFeelingList({ size: 16 });
    const ratingValue = (currentUser?.ratingSystem === RatingSystemType.SCORE) ? rating : getFeelingIcon(rating, { valueOnly: true });

    const handleSelectChange = (value: string) => {
        const valueToSend = value === "-" ? null : parseFloat(value);
        onUpdateMutation.mutate({ payload: { rating: valueToSend, type: UpdateType.RATING } });
    };

    return (
        <div className="flex justify-between items-center">
            <Select value={ratingValue?.toString() ?? "-"} onValueChange={handleSelectChange} disabled={onUpdateMutation?.isPending}>
                <SelectTrigger size="sm" className="w-34">
                    <SelectValue/>
                </SelectTrigger>
                <SelectContent className="max-h-75 overflow-y-auto">
                    {ratingList.map((rating) =>
                        <SelectItem key={rating.value} value={rating.value?.toString() ?? "-"}>
                            {rating.component}
                        </SelectItem>
                    )}
                </SelectContent>
            </Select>
        </div>
    );
};
