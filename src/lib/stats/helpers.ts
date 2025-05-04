import {getFeelingIcon} from "@/lib/utils/functions";
import {RatingSystemType} from "@/lib/server/utils/enums";
import type {StatCardData, StatListData} from "@/lib/stats/types";


export const createStatCard = (title: string, value: any, subtitle: string, data?: any): StatCardData => ({
    data: data,
    title: title,
    subtitle: subtitle,
    value: value || "-",
});


export const createRatingStatCard = (ratingSystem: RatingSystemType, avgRating: number, totalRated: number): StatCardData => {
    const isScoreSystem = ratingSystem === RatingSystemType.SCORE;
    const displayValue = isScoreSystem ? avgRating : getFeelingIcon(avgRating, { size: 25, className: "mt-1.5" });

    return {
        title: "Avg. Rating",
        value: displayValue || "-",
        subtitle: `With ${totalRated} media rated`,
    };
};


export const createStatList = (title: string, data: any): StatListData => ({ title, data });


export const getCardsData = (data: any, suffix = "Watched"): StatCardData[] => {
    const topRated = data?.topRated?.[0] || { value: "-", name: "-" };
    const topValue = data?.topValues?.[0] || { value: "-", name: "-" };
    const topFavorited = data?.topFavorited?.[0] || { value: "-", name: "-" };

    return [
        {
            value: topValue.name,
            title: `Top ${suffix}`,
            subtitle: `With ${topValue.value} media`,
        },
        {
            title: "Top Rated",
            value: topRated.name,
            subtitle: `With a Rating of ${topRated.value}`,
        },
        {
            title: "Top Favorited",
            value: topFavorited.name,
            subtitle: `With ${topFavorited.value} favorites`,
        },
    ];
};


export const getListsData = (data: any, suffix = "Watched"): StatListData[] => {
    const topRatedData = data?.topRated || [];
    const topValuesData = data?.topValues || [];
    const topFavoritedData = data?.topFavorited || [];

    return [
        { title: "Top Ratings", data: topRatedData },
        { title: `Top ${suffix}`, data: topValuesData },
        { title: "Top Favorited", data: topFavoritedData },
    ];
};
