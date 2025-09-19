import {getFeelingIcon} from "@/lib/utils/functions";
import {RatingSystemType} from "@/lib/server/utils/enums";
import {StatCardData, StatListData} from "@/lib/types/stats.types";
import {NameValuePair, TopMetricStats} from "@/lib/types/base.types";


export const createStatCard = (title: string, value: any, subtitle: string, data?: NameValuePair[]): StatCardData => {
    return {
        title: title,
        valuesList: data,
        subtitle: subtitle,
        value: value ?? "-",
    };
};


export const createRatingStatCard = (ratingSystem: RatingSystemType, avgRating: number | null, totalRated: number): StatCardData => {
    const displayValue = (ratingSystem === RatingSystemType.FEELING) ?
        getFeelingIcon(avgRating, { size: 25, className: "mt-1.5" }) : avgRating?.toFixed(2);

    return {
        title: "Avg. Rating",
        value: displayValue ?? "-",
        subtitle: `Total: ${totalRated} Media Rated`,
    };
};


export const createStatList = (title: string, data: NameValuePair[]): StatListData => {
    return ({ title, data });
}


export const getCardsData = (data: TopMetricStats, suffix = "Watched"): StatCardData[] => {
    const topRated = data.topRated[0];
    const topValue = data.topValues[0];
    const topFavorited = data.topFavorited[0];
    
    return [
        {
            value: topValue.name,
            title: `Top ${suffix}`,
            subtitle: `With ${topValue.value} Media`,
        },
        {
            title: "Top Rated",
            value: topRated.name,
            subtitle: `With a Rating of ${topRated.value}`,
        },
        {
            title: "Top Favorited",
            value: topFavorited.name,
            subtitle: `With ${topFavorited.value} Favorites`,
        },
    ];
};


export const getListsData = (data: TopMetricStats, suffix = "Watched"): StatListData[] => {
    const topRatedData = data.topRated || [];
    const topValuesData = data.topValues || [];
    const topFavoritedData = data.topFavorited || [];

    return [
        { title: `Top ${suffix}`, data: topValuesData },
        { title: "Top Ratings", data: topRatedData },
        { title: "Top Favorited", data: topFavoritedData },
    ];
};
