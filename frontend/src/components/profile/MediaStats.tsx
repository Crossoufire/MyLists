import {LuArrowRight} from "react-icons/lu";
import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/components/ui/tooltip";
import {getStatusColor} from "@/utils/functions";
import {MediaStatsItem, User} from "@/utils/types";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";
import {BlockLink} from "@/components/app/BlockLink";
import {BulletIcon} from "@/components/profile/BulletIcon";


export const MediaStats = ({user, mediaStats}: MediaStatsProps) => {
    return (
        <div>
            <div className="flex flex-wrap justify-between text-center font-medium max-sm:text-sm">
                <MediaValues
                    title="Time (d)"
                    value={mediaStats.time_days}
                />
                {mediaStats.media_type === "books" &&
                    <MediaValues
                        title="Pages"
                        value={mediaStats.specific_total}
                    />
                }
                {mediaStats.media_type === "movies" &&
                    <MediaValues
                        title="Watched"
                        value={mediaStats.specific_total}/>
                }
                {["series", "anime"].includes(mediaStats.media_type) &&
                    <MediaValues
                        title="Episodes"
                        value={mediaStats.specific_total}/>
                }
                <MediaValues
                    title="Entries"
                    value={mediaStats.total_media}
                />
                {!user.add_feeling &&
                    <MediaValues
                        title="Rating"
                        value={mediaStats.mean_metric.toFixed(2)}/>
                }
                <MediaValues
                    title="Scored"
                    value={`${mediaStats.media_metric}/${mediaStats.total_media_no_plan_to_x}`}
                />
            </div>
            <MediaStatuses
                mediaStats={mediaStats}
                username={user.username}
            />
            <MediaFavorites
                mediaStats={mediaStats}
                username={user.username}
            />
            <Separator className="mt-3 mb-1.5"/>
            <div className="flex items-center justify-end">
                <Link to={`/stats/${mediaStats.media_type}/${user.username}`} className="text-base font-medium hover:underline">
                    Advanced stats<LuArrowRight className="inline-block ml-1"/>
                </Link>
            </div>
        </div>
    );
};


function MediaValues({title, value}: { title: string, value: string | number }) {
    return (
        <div>
            <div className="text-neutral-500">{title}</div>
            <div>{value}</div>
        </div>
    );
}


function MediaStatuses({mediaStats, username}: { mediaStats: MediaStatsProps["media"], username: string }) {
    return (
        <div>
            <div className="flex h-8 mb-2 mt-2 max-sm:h-6">
                {mediaStats.no_data ?
                    <span className="flex-grow bg-black"/>
                    :
                    mediaStats.status_count.map(st =>
                        <Tooltip key={`${st.status}-${mediaStats.media_type}`} text={st.status}>
                            <span className="flex-grow" style={{width: `${st.percent}%`, backgroundColor: getStatusColor(st.status)}}/>
                        </Tooltip>
                    )
                }
            </div>
            <div className="grid grid-cols-2 font-medium gap-y-2 gap-x-8 px-2 max-sm:px-0 max-sm:text-xs">
                {mediaStats.status_count.map(st =>
                    <div key={`${st.status}-${mediaStats.media_type}`} className="flex justify-between">
                        <Link to={`/list/${mediaStats.media_type}/${username}`} search={{status: [st.status]}} className="text-neutral-500">
                            <BulletIcon color={getStatusColor(st.status)}/> {st.status}
                        </Link>
                        <div>{st.count}</div>
                    </div>
                )}
            </div>
        </div>
    );
}


function MediaFavorites({mediaStats, username}: { mediaStats: MediaStatsProps["media"], username: string }) {
    return (
        <div className="mt-4">
            <Link to={`/list/${mediaStats.media_type}/${username}`} search={{favorite: true}} className="text-lg font-medium hover:underline">
                Favorites ({mediaStats.total_favorites})
            </Link>
            {mediaStats.total_favorites === 0 ?
                <MutedText>No favorites added yet</MutedText>
                :
                <div className="grid grid-cols-10 max-sm:grid-cols-5 gap-1">
                    {mediaStats.favorites.map(m =>
                        <BlockLink key={m.media_name} to={`/details/${mediaStats.media_type}/${m.media_id}`} className="col-span-1 md:col-span-1 mt-2">
                            <Tooltip text={m.media_name}>
                                <img
                                    alt={m.media_name}
                                    src={m.media_cover}
                                    id={`${mediaStats.media_type}-${m.media_id}`}
                                    className="h-[78px] w-[52px] rounded-sm"
                                />
                            </Tooltip>
                        </BlockLink>
                    )}
                </div>
            }
        </div>
    );
}


interface MediaStatsProps {
    user: User;
    mediaStats: MediaStatsItem;
}