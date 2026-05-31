import {RatingSystemType} from "@/lib/utils/enums";
import {FaAngry, FaFrown, FaGrinAlt, FaGrinStars, FaPoop, FaSmile} from "react-icons/fa";


export const formatRating = (system: RatingSystemType, rating: number | null, returnNull: boolean = false) => {
    if (system === RatingSystemType.FEELING) {
        return getFeelingIcon(rating, { size: 17 });
    }

    if (returnNull) {
        return rating === null ? null : rating.toFixed(1);
    }

    return (rating === null) ? "-" : rating.toFixed(1);
}


export const getScoreList = () => {
    const STEP = 0.5;
    const MIN_SCORE = 0;
    const MAX_SCORE = 10;

    const scores = Array.from({ length: (MAX_SCORE - MIN_SCORE) / STEP + 1 }, (_, i) => MIN_SCORE + i * STEP);

    return [
        { label: null, value: "-" },
        ...scores.map((label) => ({
            label: label.toString(),
            value: label === MAX_SCORE ? label.toString() : label.toFixed(1)
        }))
    ];
};


export const getFeelingList = ({ className, size = 20 }: { className?: string, size?: number }) => {
    return [
        { label: null, value: <span>-</span> },
        { label: "0", value: <FaPoop className={className} color="saddlebrown" size={size}/> },
        { label: "2", value: <FaAngry className={className} color="indianred" size={size}/> },
        { label: "4", value: <FaFrown className={className} color="#d0a141" size={size}/> },
        { label: "6", value: <FaSmile className={className} color="darkseagreen" size={size}/> },
        { label: "8", value: <FaGrinAlt className={className} color="#59a643" size={size}/> },
        { label: "10", value: <FaGrinStars className={className} color="#019101" size={size}/> },
    ];
};


export const formatAvgRating = (ratingSystem: RatingSystemType, value: number | null) => {
    if (ratingSystem === RatingSystemType.FEELING) {
        return getFeelingIcon(value, { size: 30 });
    }

    return value?.toFixed(2) ?? "-";
};


interface GetFeelingIcon {
    size?: number;
    className?: string;
    labelOnly?: boolean;
}


export const getFeelingIcon = (value: number | null, { className, size, labelOnly }: GetFeelingIcon = {}) => {
    if (!value || value < 0 || value > 10) return "-";

    const feelingList = getFeelingList({ className, size });

    let closest = feelingList[0];
    let smallestDelta = Math.abs(value - Number(feelingList[0].label));
    for (const mood of feelingList) {
        const delta = Math.abs(value - Number(mood.label));
        if (delta < smallestDelta || (delta === smallestDelta && mood.label! < closest.label!)) {
            closest = mood;
            smallestDelta = delta;
        }
    }

    if (labelOnly) {
        return closest.label;
    }

    return closest.value;
};
