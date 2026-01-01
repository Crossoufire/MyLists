import {useMemo} from "react";
import {Link} from "@tanstack/react-router";
import {getThemeColor} from "@/lib/utils/colors-and-icons";
import {Clock, ClockAlert, MoveRight, Star} from "lucide-react";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {SimpleStatCard} from "@/lib/client/components/user-profile/SimpleStatCard";
import {MediaFavoritesGrid} from "@/lib/client/components/user-profile/FavoritesGrid";
import {DistributionContainer} from "@/lib/client/components/user-profile/ProfileDistrib";
import {MediaGlobalSummaryType, PerMediaSummaryType} from "@/lib/types/query.options.types";


interface OverviewTabProps {
    username: string,
    perMedia: PerMediaSummaryType,
    globalStats: MediaGlobalSummaryType,
}


export const OverviewTab = ({ username, globalStats, perMedia }: OverviewTabProps) => {
    const favoritesList = useMemo(() => perMedia.flatMap((media) =>
        media.favoritesList.map((fav) => ({ ...fav, mediaType: media.mediaType }))
    ).sort(() => Math.random() - 0.5), [perMedia]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
                <SimpleStatCard
                    title="Total Time"
                    value={`${globalStats.totalDays.toFixed(0)} d`}
                />
                <SimpleStatCard
                    title="Total Entries"
                    value={globalStats.totalEntries}
                />
                <SimpleStatCard
                    title="Avg. Rating"
                    value={globalStats.avgRated?.toFixed(2)}
                    icon={<Star className="size-5 text-app-rating mt-1"/>}
                />
                <SimpleStatCard
                    title="Rated Media"
                    value={globalStats.percentRated ? `${globalStats.percentRated.toFixed(1)}%` : undefined}
                />
            </div>

            <DistributionContainer label="Time Distribution" icon={Clock}>
                {globalStats.totalDays === 0 ?
                    <EmptyState
                        icon={ClockAlert}
                        message="No time to display yet."
                    />
                    :
                    <div className="flex gap-0.5 h-5 rounded-sm overflow-hidden bg-background">
                        {perMedia.map((media) => {
                            const percentage = (media.timeSpentDays / globalStats.totalDays) * 100;
                            return (
                                <div
                                    key={media.mediaType}
                                    className="h-full flex items-center justify-center"
                                    title={`${media.mediaType}: ${percentage.toFixed(1)}%`}
                                    style={{ flex: media.timeSpentDays, backgroundColor: getThemeColor(media.mediaType) }}
                                >
                                    {percentage > 5 &&
                                        <span className="text-xs truncate tracking-wider font-medium text-black px-0.5">
                                        {Math.round(percentage)}%
                                    </span>
                                    }
                                </div>
                            );
                        })}
                    </div>
                }
                <div className="flex gap-1 mt-1 pb-2">
                    {perMedia.map((media) =>
                        <div key={media.mediaType} className="overflow-hidden" style={{ flex: media.timeSpentDays }}>
                            {(media.timeSpentDays / globalStats.totalDays) * 100 > 5 &&
                                <span className="block font-medium text-xs text-muted-foreground uppercase tracking-wider truncate">
                                    {media.mediaType}
                                </span>
                            }
                        </div>
                    )}
                </div>
            </DistributionContainer>

            <MediaFavoritesGrid
                title="Media Favorites"
                favorites={favoritesList}
            />

            <div className="flex justify-end items-center gap-2 -mt-4 font-semibold text-muted-foreground">
                <Link to="/stats/$username" params={{ username }}>
                    <div className="flex justify-end items-center gap-2">
                        Advanced Stats <MoveRight className="size-4"/>
                    </div>
                </Link>
            </div>
        </div>
    );
};
