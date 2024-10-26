import {Rating} from "@/utils/types";
import {LuStar} from "react-icons/lu";
import React, {ReactNode} from "react";
import {UseMutationResult} from "@tanstack/react-query";
import {getFeelingValues, getScoreValues} from "@/utils/functions";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


interface RatingComponentProps {
    rating: {
        type_: Rating;
        value: number | string;
    };
    onUpdate: UseMutationResult;
    isEditable?: boolean;
    inline?: boolean;
}


interface RatingSelectProps {
    isPending: boolean;
    items: ReactNode[];
    className?: string;
    value: number | string;
    size?: "list" | "details";
    onChange: (newRating: number | string) => void;
}


interface RatingDisplayProps {
    type: Rating;
    value: number | string;
    ratingValues: Array<{ value: number | string, icon: ReactNode } | Array<number | string>>
}


export const RatingComponent = ({rating, onUpdate, isEditable = true, inline = false}: RatingComponentProps) => {
    const ratingValues = (rating.type_ === "feeling") ? getFeelingValues(16) : getScoreValues();

    const selectItems = ratingValues.map(val => {
        if (rating.type_ === "feeling") {
            // @ts-ignore
            return <SelectItem key={val.value} value={val.value}>{val.icon}</SelectItem>;
        }
        return <SelectItem key={val} value={val}>{typeof val === "number" ? val.toFixed(1) : "--"}</SelectItem>;
    });

    const handleSelectChange = (newRating: number) => {
        onUpdate.mutate({payload: newRating});
    };

    // @ts-ignore
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
            type={rating.type_}
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


const RatingSelect = ({value, onChange, isPending, items, className = "w-[130px]", size = "details"}: RatingSelectProps) => (
    <Select value={value} onValueChange={onChange} disabled={isPending}>
        <SelectTrigger className={className} size={size} variant={size === "details" ? "" : "noIcon"}>
            <SelectValue/>
        </SelectTrigger>
        <SelectContent>
            {items}
        </SelectContent>
    </Select>
);


const RatingDisplay = ({type, value, ratingValues}: RatingDisplayProps) => {
    if (type === "feeling") {
        // @ts-ignore
        const selectedRating = ratingValues.find(r => r.value === value);
        // @ts-ignore
        return <span>{selectedRating ? selectedRating.icon : "--"}</span>;
    }
    return <span>{typeof value === "number" ? value.toFixed(1) : "--"}</span>;
};
