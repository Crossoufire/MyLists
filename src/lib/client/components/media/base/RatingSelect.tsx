import {useAuth} from "@/lib/client/hooks/use-auth";
import {DEFAULT_DASH_FALLBACK} from "@/lib/utils/constants";
import {RatingSystemType} from "@/lib/utils/enums";
import {formatRating, getFeelingIcon, getFeelingList, getScoreList} from "@/lib/client/ratings";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";

interface RatingSelectProps {
    rating: number | null;
    onChange: (rating: number | null) => void;
    disabled?: boolean;
    bulk?: boolean;
    label?: string;
}

export const RatingSelect = ({ rating, onChange, disabled = false, bulk = false, label = "Rating" }: RatingSelectProps) => {
    const { currentUser } = useAuth();
    const system = currentUser!.ratingSystem;
    const choices = system === RatingSystemType.SCORE ? getScoreList() : getFeelingList({ size: 16 });
    const items = choices.map(choice => ({ label: choice.value, value: choice.label ?? DEFAULT_DASH_FALLBACK }));
    const selected = system === RatingSystemType.SCORE ? rating : getFeelingIcon(rating, { labelOnly: true });

    return (
        <Select
            items={items}
            // Bulk selection is an action, even when the chosen score equals the current average.
            value={bulk ? null : selected?.toString() ?? DEFAULT_DASH_FALLBACK}
            onValueChange={value => {
                if (value !== null) onChange(value === DEFAULT_DASH_FALLBACK ? null : Number(value));
            }}
            disabled={disabled}
        >
            <SelectTrigger size="sm" className="w-34" aria-label={label} title={bulk ? "Set all current seasons" : undefined}>
                <SelectValue>{formatRating(system, rating)}</SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-75 overflow-y-auto scrollbar-thin">
                <SelectGroup>
                    {items.map(item => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
