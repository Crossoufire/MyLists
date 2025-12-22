import {Status} from "@/lib/utils/enums";
import {Link} from "@tanstack/react-router";
import {getStatusColor} from "@/lib/utils/functions";
import {PerMediaSummaryType} from "@/lib/types/query.options.types";
import {BarChart3, ChartNoAxesColumn, MoveRight, Star} from "lucide-react";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";
import {ProfileStatCard} from "@/lib/client/components/user-profile/ProfileStatCard";
import {MediaFavoritesGrid} from "@/lib/client/components/user-profile/FavoritesGrid";
import {DistributionContainer} from "@/lib/client/components/user-profile/ProfileDistrib";


interface MediaStatsTabProps {
    username: string,
    mediaSummary: PerMediaSummaryType[number],
}


export const MediaStatsTab = ({ username, mediaSummary }: MediaStatsTabProps) => {
    if (!mediaSummary) return null;

    const favoritesList = mediaSummary.favoritesList.map((fav) => ({
        ...fav,
        mediaType: mediaSummary.mediaType,
    }));

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2">
                <ProfileStatCard
                    title="Entries"
                    value={mediaSummary.totalEntries}
                />
                <ProfileStatCard
                    title="Time (Days)"
                    value={Math.round(mediaSummary.timeSpentDays)}
                />
                <ProfileStatCard
                    title="Avg. Rating"
                    value={mediaSummary.avgRated?.toFixed(2)}
                    icon={<Star className="size-5 text-app-rating mt-1"/>}
                />
                <ProfileStatCard
                    title="Completed"
                    value={mediaSummary.statusList.find((s) => s.status === "Completed")?.count || 0}
                />
            </div>

            <DistributionContainer label="Status Distribution" icon={BarChart3}>
                {mediaSummary.noData ?
                    <EmptyState
                        icon={ChartNoAxesColumn}
                        message="No status to display yet."
                    />
                    :
                    <div className="flex gap-0.5 h-5 rounded-sm overflow-hidden bg-background">
                        {mediaSummary.statusList.map((status) =>
                            <div
                                key={status.status}
                                className="h-full flex items-center justify-center"
                                title={`${status.status}: ${status.percent.toFixed(1)}%`}
                                style={{ width: `${status.percent}%`, backgroundColor: getStatusColor(status.status) }}
                            />
                        )}
                    </div>
                }
                <div className="flex flex-wrap gap-x-4 gap-y-2 mt-1">
                    {mediaSummary.statusList.map((st) =>
                        <div key={st.status} className="flex items-center gap-1.5 overflow-hidden">
                            <div className="size-2 rounded-full mt-1" style={{ backgroundColor: getStatusColor(st.status) }}/>
                            <Link
                                to="/list/$mediaType/$username"
                                search={{ status: [st.status] as Status[] }}
                                params={{ mediaType: mediaSummary.mediaType, username }}
                            >
                                <span className="text-sm font-medium text-muted-foreground hover:text-app-accent">
                                    {st.status}{" "}
                                    <span className="text-xs">
                                        ({st.count})
                                    </span>
                                </span>
                            </Link>
                        </div>
                    )}
                </div>
            </DistributionContainer>

            <MediaFavoritesGrid
                favorites={favoritesList}
                title={`Favorites (${mediaSummary.EntriesFavorites})`}
                linkProps={{
                    search: { favorite: true },
                    to: "/list/$mediaType/$username",
                    params: { mediaType: mediaSummary.mediaType, username }
                }}
            />

            <div className="flex justify-end items-center gap-2 -mt-4 font-semibold text-muted-foreground">
                <Link to="/stats/$username" params={{ username }} search={{ mediaType: mediaSummary.mediaType }}>
                    <div className="flex justify-end items-center gap-2">
                        Advanced Stats <MoveRight className="size-4"/>
                    </div>
                </Link>
            </div>
        </div>
    );
};