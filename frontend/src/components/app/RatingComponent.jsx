import {LuStar} from "react-icons/lu";
import {getFeelingValues, getScoreValues} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const RatingComponent = ({ rating, onUpdate, isEditable = true, inline = false }) => {
    const ratingValues = (rating.type === "feeling") ? getFeelingValues(16) : getScoreValues();

    const selectItems = ratingValues.map(val =>
        <SelectItem key={val?.value ?? val} value={val?.value ?? val}>
            {rating.type === "feeling" ? val.icon : (typeof val === "number" ? val.toFixed(1) : "--")}
        </SelectItem>
    );

    const handleSelectChange = (newRating) => {
        onUpdate.mutate({ payload: newRating });
    };

    const ratingContent = isEditable ?
        <RatingSelect
            items={selectItems}
            value={rating.value}
            onChange={handleSelectChange}
            isPending={onUpdate.isPending}
            size={inline ? "list" : "details"}
            className={inline ? "w-[30px]" : "w-[130px]"}
        />
        :
        <RatingDisplay
            type={rating.type}
            value={rating.value}
            ratingValues={ratingValues}
        />;

    return (
        <div className={`flex ${inline ? "items-center gap-2" : "justify-between items-center"}`} title="Rating">
            {inline && <LuStar/>}
            {ratingContent}
        </div>
    );
};


const RatingSelect = ({ value, onChange, isPending, items, className = "w-[130px]", size = "details" }) => (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
        <SelectTrigger className={className} size={size} variant={size === "details" ? "" : "noIcon"}>
            <SelectValue/>
        </SelectTrigger>
        <SelectContent>
            {items}
        </SelectContent>
    </Select>
);


const RatingDisplay = ({ type, value, ratingValues }) => {
    if (type === "feeling") {
        const selectedRating = ratingValues.find(r => r.value === value);
        return <span>{selectedRating ? selectedRating.icon : "--"}</span>;
    }
    return <span>{typeof value === "number" ? value.toFixed(1) : "--"}</span>;
};
