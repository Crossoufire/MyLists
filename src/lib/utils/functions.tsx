import {Globe, Lock, Shield} from "lucide-react";
import {FaAngry, FaFrown, FaGrinAlt, FaGrinStars, FaPoop, FaSmile} from "react-icons/fa";
import {AchievementDifficulty, MediaType, PrivacyType, RatingSystemType, Status} from "@/lib/utils/enums";


export const CURRENT_DATE = new Date();


// --- Ratings / Redo / Playtime ----------------------------------------------------------------------------

export const statusUtils = {
    getNoPlanTo: (): Status[] => [Status.PLAN_TO_WATCH, Status.PLAN_TO_PLAY, Status.PLAN_TO_READ],
    byMediaType: (mediaType: MediaType) => {
        switch (mediaType) {
            case MediaType.SERIES:
            case MediaType.ANIME:
                return [Status.WATCHING, Status.COMPLETED, Status.ON_HOLD, Status.RANDOM, Status.DROPPED, Status.PLAN_TO_WATCH];
            case MediaType.MOVIES:
                return [Status.COMPLETED, Status.PLAN_TO_WATCH];
            case MediaType.GAMES:
                return [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_PLAY];
            case MediaType.BOOKS:
                return [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ];
            case MediaType.MANGA:
                return [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ];
        }
    },
};


export const mediaTypeUtils = {
    getTypesForNotifications: (): MediaType[] => [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES],
    getComingNextTypes: (): MediaType[] => [MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.GAMES],
};


export const getTextColor = (backColor: string) => {
    const hex = backColor.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 2 + 2), 16);
    const b = parseInt(hex.substring(4, 4 + 2), 16);

    return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? "#000000" : "#ffffff";
};


export const formatRating = (system: RatingSystemType, rating: number | null, returnNull: boolean = false) => {
    if (system === RatingSystemType.FEELING) {
        return getFeelingIcon(rating, { size: 17 });
    }

    if (returnNull) {
        return rating === null ? null : rating.toFixed(1);
    }

    return (rating === null) ? "-" : rating.toFixed(1);
}


export const getFeelingIcon = (value: number | null, { className, size, valueOnly }: FeelIconProps = {}) => {
    if (!value || value < 0 || value > 10) return "-";

    const feelValues = getFeelingList({ className, size });

    let closest = feelValues[0];
    let smallestDelta = Math.abs(value - feelValues[0].value!);
    for (const mood of feelValues) {
        const delta = Math.abs(value - mood.value!);
        if (delta < smallestDelta || (delta === smallestDelta && mood.value! < closest.value!)) {
            closest = mood;
            smallestDelta = delta;
        }
    }

    if (valueOnly) {
        return closest.value;
    }

    return closest.component;
};


export const getFeelingList = ({ className, size = 20 }: FeelListProps) => {
    return [
        { value: null, component: "-" },
        { value: 0, component: <FaPoop className={className} color="saddlebrown" size={size}/> },
        { value: 2, component: <FaAngry className={className} color="indianred" size={size}/> },
        { value: 4, component: <FaFrown className={className} color="#d0a141" size={size}/> },
        { value: 6, component: <FaSmile className={className} color="darkseagreen" size={size}/> },
        { value: 8, component: <FaGrinAlt className={className} color="#59a643" size={size}/> },
        { value: 10, component: <FaGrinStars className={className} color="#019101" size={size}/> },
    ];
};


export const getScoreList = () => {
    const STEP = 0.5;
    const MIN_SCORE = 0;
    const MAX_SCORE = 10;

    const scores = Array.from({ length: (MAX_SCORE - MIN_SCORE) / STEP + 1 }, (_, i) => MIN_SCORE + i * STEP);

    return [
        { value: null, component: "-" },
        ...scores.map(value => ({ value, component: value === MAX_SCORE ? value : value.toFixed(1) }))
    ];
};


export const getPlaytimeList = () => {
    const ranges = [
        { start: 0, end: 50, step: 5 },
        { start: 60, end: 100, step: 10 },
        { start: 125, end: 300, step: 25 },
        { start: 350, end: 600, step: 50 },
        { start: 700, end: 1000, step: 100 },
        { start: 1500, end: 3000, step: 500 },
        { start: 4000, end: 10000, step: 1000 }
    ];

    const specialCases = [0, 2];

    return [
        ...specialCases,
        ...ranges.flatMap(({ start, end, step }) =>
            Array.from(
                { length: Math.floor((end - start) / step) + 1 },
                (_, i) => start + i * step,
            )
        ).filter(value => !specialCases.includes(value))
    ];
};


export const getRedoList = () => {
    return [...Array(11).keys()];
};


// --- Icons & Colors ---------------------------------------------------------------------------------------

export const getMediaColor = (mediaType: MediaType | "user" | "overview" | undefined) => {
    if (!mediaType) return "#575757";

    const colors = {
        user: "#b6b6b6",
        overview: "#b6b6b6",
        [MediaType.SERIES]: "#267f90",
        [MediaType.ANIME]: "#ab5e4b",
        [MediaType.MOVIES]: "#a28b27",
        [MediaType.BOOKS]: "#6b5c86",
        [MediaType.GAMES]: "#217f21",
        [MediaType.MANGA]: "#a04646",
    };

    return colors[mediaType] ?? "#989898";
};


export const getStatusColor = (status: Status) => {
    const colors = {
        [Status.PLAYING]: "#334d5c",
        [Status.READING]: "#334d5c",
        [Status.WATCHING]: "#334d5c",
        [Status.COMPLETED]: "#45b29d",
        [Status.ON_HOLD]: "#efc94c",
        [Status.MULTIPLAYER]: "#b19026",
        [Status.RANDOM]: "#e27a3f",
        [Status.DROPPED]: "#df5a49",
        [Status.ENDLESS]: "#48792c",
        [Status.PLAN_TO_WATCH]: "#962d3e",
        [Status.PLAN_TO_READ]: "#962d3e",
        [Status.PLAN_TO_PLAY]: "#962d3e",
    };
    return colors[status];
};


export const diffColors = (difficulty: AchievementDifficulty | "total" | undefined, variant: "text" | "border" | "bg" = "text") => {
    if (!difficulty) return "";

    const colors: { [key: string]: string } = {
        "border-bronze": "border-amber-700",
        "border-silver": "border-slate-400",
        "border-gold": "border-yellow-600",
        "border-platinum": "border-teal-600",
        "bg-bronze": "bg-amber-700",
        "bg-silver": "bg-slate-400",
        "bg-gold": "bg-yellow-600",
        "bg-platinum": "bg-teal-600",
        "text-bronze": "text-amber-700",
        "text-silver": "text-slate-400",
        "text-gold": "text-yellow-600",
        "text-platinum": "text-teal-600",
    };
    return colors[`${variant}-${difficulty}`];
};


export const PrivacyIcon = ({ type }: { type: PrivacyType }) => {
    switch (type) {
        case "public":
            return <Globe className="size-3 text-emerald-400"/>;
        case "private":
            return <Lock className="size-3 text-red-400"/>;
        case "restricted":
        default:
            return <Shield className="size-3 text-amber-400"/>;
    }
};


// --- Time Format ------------------------------------------------------------------------------------------

export const getYear = (date?: string | null) => {
    return date?.split("-")[0] ?? "-";
}

export const formatDuration = (minutes: number | null | undefined) => {
    if (!minutes) return "-";

    const h = Math.floor(minutes / 60);
    const m = minutes % 60;

    return h > 0 ? `${h}h ${m}m` : `${m}m`;
};


export const getDaysRemaining = (dateString: string | null) => {
    if (!dateString) return null;

    const targetDate = new Date(dateString);
    const diffTime = targetDate.getTime() - CURRENT_DATE.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    return diffDays;
};


export const formatMinutes = (minutes: number | string | null | undefined, onlyHours = false) => {
    if (!minutes) return "-";

    const minutesAsNumber = Number(minutes);

    if (isNaN(minutesAsNumber) || minutesAsNumber <= 0) {
        return "-";
    }

    const hours = Math.floor(minutesAsNumber / 60);
    const displayMinutes = Math.floor(minutesAsNumber % 60);

    if (onlyHours) {
        return `${String(hours).padStart(2, "0")} h`;
    }

    return `${String(hours).padStart(2, "0")} h ${String(displayMinutes).padStart(2, "0")}`;
};


interface FeelIconProps {
    size?: number;
    className?: string;
    valueOnly?: boolean;
}


interface FeelListProps {
    className?: string;
    size?: number;
}
