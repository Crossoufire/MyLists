import {getFeelingIcon} from "@/lib/utils/functions";
import {MediaType, RatingSystemType} from "@/lib/utils/enums";
import {MediaNaming, NamedValue} from "@/lib/types/stats.types";


export const getMediaNaming = (mediaType: MediaType) => {
    const data: Record<MediaType, MediaNaming> = {
        series: {
            redo: "seasons re-watched",
            durationDistributionUnit: "h",
            totalSpecific: "Total Episodes Watched",
            durationDistribution: "Series Duration Distribution",
        },
        anime: {
            redo: "seasons re-watched",
            durationDistributionUnit: "h",
            totalSpecific: "Total Episodes Watched",
            durationDistribution: "Anime Duration Distribution",
        },
        movies: {
            redo: "movies re-watched",
            durationDistributionUnit: "m.",
            totalSpecific: "Total Movies Watched",
            durationDistribution: "Movies Duration Distribution",
        },
        games: {
            durationDistributionUnit: "h",
            durationDistribution: "Playthrough Duration Distribution",
        },
        books: {
            redo: "books re-read",
            durationDistributionUnit: "p.",
            totalSpecific: "Total Pages Read",
            durationDistribution: "Pages Distribution",
        },
        manga: {
            redo: "manga re-read",
            durationDistributionUnit: "c.",
            totalSpecific: "Total Chapters Read",
            durationDistribution: "Chapters Distribution",
        },
    }

    return data[mediaType];
}


export const formatCurrency = (num: number, options: Intl.NumberFormatOptions = {}) => {
    return new Intl.NumberFormat("en", {
        currency: "USD",
        style: "currency",
        notation: "compact",
        maximumFractionDigits: 1,
        ...options,
    }).format(num);
}


export const formatDuration = (hours: number) => {
    if (hours < 24) {
        return `${hours.toFixed(1)}h`;
    }

    const days = Math.floor(hours / 24);
    const remainingHours = Math.floor(hours % 24);

    if (days < 30) {
        return `${days}d ${remainingHours}h`;
    }

    if (days < 365) {
        const months = Math.floor(days / 30);
        const remainingDays = days % 30;
        return `${months}m ${remainingDays}d`;
    }

    const years = Math.floor(days / 365);
    const remainingMonths = Math.floor((days % 365) / 30);
    return `${years}y ${remainingMonths}m`;
};


export const formatPercent = (num: number | null | undefined) => {
    if (num === null || num === undefined) {
        return "-";
    }

    return `${num.toFixed(1)}%`;
};


export const formatNumber = (num: number | null | undefined, options: Intl.NumberFormatOptions = {}) => {
    if (num === null || num === undefined) {
        return "-";
    }

    return num.toLocaleString("fr", { ...options });
};


export const formatAvgRating = (ratingSystem: RatingSystemType, rating: number | null) => {
    let ratingValue: string | number | React.ReactElement | null = "-";

    if (ratingSystem === RatingSystemType.FEELING) {
        ratingValue = getFeelingIcon(rating, { size: 30 });
    }
    else {
        ratingValue = rating?.toFixed(2) ?? "-";
    }

    return ratingValue;
}


export const transformRatingToFeeling = (ratings: NamedValue[]) => {
    const validValues = [0, 2, 4, 6, 8, 10];
    const validIndices = validValues.map((value) => value * 2);
    const feelings = validValues.map((_, idx) => ({ name: idx * 2, value: 0 }));

    ratings.forEach((item, idx) => {
        if (item.value !== 0) {
            const closestValidIndex = validIndices.reduce((prev, curr) => {
                const prevDiff = Math.abs(idx - prev);
                const currDiff = Math.abs(idx - curr);
                if (currDiff < prevDiff || (currDiff === prevDiff && curr < prev)) {
                    return curr;
                }
                return prev;
            });

            const validIndexPosition = validIndices.indexOf(closestValidIndex);
            feelings[validIndexPosition].value += item.value;
        }
    });

    return feelings;
};
