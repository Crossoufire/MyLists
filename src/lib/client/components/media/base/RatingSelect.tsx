import {RatingSystemType} from "@/lib/utils/enums";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {DEFAULT_DASH_FALLBACK} from "@/lib/utils/constants";
import {formatRating, getFeelingIcon, getFeelingList, getScoreList} from "@/lib/client/ratings";
import {Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface RatingSelectProps {
    bulk?: boolean;
    label?: string;
    disabled?: boolean;
    rating: number | null;
    onChange: (rating: number | null) => void;
}


export const RatingSelect = ({ rating, onChange, disabled = false, bulk = false, label = "Rating" }: RatingSelectProps) => {
    const { currentUser } = useAuth();
    const system = currentUser!.ratingSystem;

    const choices = system === RatingSystemType.SCORE
        ? getScoreList()
        : getFeelingList({ size: 16 });

    const selected = system === RatingSystemType.SCORE
        ? rating
        : getFeelingIcon(rating, { labelOnly: true });

    const items = choices.map(choice => ({
        label: choice.value,
        value: choice.label ?? DEFAULT_DASH_FALLBACK,
    }));

    return (
        <Select
            items={items}
            disabled={disabled}
            value={bulk ? null : selected?.toString() ?? DEFAULT_DASH_FALLBACK}
            onValueChange={value => {
                if (value !== null) onChange(value === DEFAULT_DASH_FALLBACK ? null : Number(value));
            }}
        >
            <SelectTrigger className="w-26 h-7! rounded-l-md" title={bulk ? "Set all current seasons" : undefined}>
                <SelectValue className="text-primary-foreground">
                    {formatRating(system, rating)}
                </SelectValue>
            </SelectTrigger>
            <SelectContent className="max-h-75 overflow-y-auto scrollbar-thin">
                <SelectGroup>
                    {items.map(item =>
                        <SelectItem key={item.value} value={item.value}>
                            {item.label}
                        </SelectItem>)
                    }
                </SelectGroup>
            </SelectContent>
        </Select>
    );
};
