import {LuArrowRight} from "react-icons/lu";
import {Tooltip} from "@/components/ui/tooltip";
import {getStatusColor} from "@/utils/functions";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";
import {BlockLink} from "@/components/app/BlockLink";
import {Link} from "@tanstack/react-router";
import {BulletIcon} from "@/components/profile/BulletIcon";


export const MediaStats = ({ user, media }) => {
    return (
        <div>
            <div className="flex flex-wrap justify-between text-center font-medium max-sm:text-sm">
                <MediaValues
                    title="Time (d)"
                    value={media.time_days}
                />
                {media.media_type === "books" &&
                    <MediaValues
                        title="Pages"
                        value={media.specific_total}
                    />
                }
                {media.media_type === "movies" &&
                    <MediaValues
                        title="Watched"
                        value={media.specific_total}/>
                }
                {["series", "anime"].includes(media.media_type) &&
                    <MediaValues
                        title="Episodes"
                        value={media.specific_total}/>
                }
                <MediaValues
                    title="Entries"
                    value={media.total_media}
                />
                {!user.add_feeling &&
                    <MediaValues
                        title="Rating"
                        value={media.mean_metric.toFixed(2)}/>
                }
                <MediaValues
                    title="Scored"
                    value={`${media.media_metric}/${media.total_media_no_plan_to_x}`}
                />
            </div>
            <MediaStatuses
                media={media}
                username={user.username}
            />
            <MediaFavorites
                media={media}
                username={user.username}
            />
            <Separator className="mt-3 mb-1.5"/>
            <div className="flex items-center justify-end">
                <Link to={`/stats/${media.media_type}/${user.username}`} className="text-base font-medium hover:underline">
                    Advanced stats<LuArrowRight className="inline-block ml-1"/>
                </Link>
            </div>
        </div>
    );
};


function MediaValues({ title, value }) {
    return (
        <div>
            <div className="text-neutral-500">{title}</div>
            <div>{value}</div>
        </div>
    );
}


function MediaStatuses({ media, username }) {
    return (
        <div>
            <div className="flex h-8 mb-2 mt-2 max-sm:h-6">
                {media.no_data ?
                    <span className="flex-grow bg-black"/>
                    :
                    media.status_count.map(st =>
                        <Tooltip key={`${st.status}-${media.media_type}`} text={st.status}>
                            <span className="flex-grow" style={{ width: `${st.percent}%`, backgroundColor: getStatusColor(st.status) }}/>
                        </Tooltip>
                    )
                }
            </div>
            <div className="grid grid-cols-2 font-medium gap-y-2 gap-x-8 px-2 max-sm:px-0 max-sm:text-xs">
                {media.status_count.map(st =>
                    <div key={`${st.status}-${media.media_type}`} className="flex justify-between">
                        <Link to={`/list/${media.media_type}/${username}`} search={{ status: [st.status] }} className="text-neutral-500">
                            <BulletIcon color={getStatusColor(st.status)}/> {st.status}
                        </Link>
                        <div>{st.count}</div>
                    </div>
                )}
            </div>
        </div>
    );
}


function MediaFavorites({ media, username }) {
    return (
        <div className="mt-4">
            <Link to={`/list/${media.media_type}/${username}`} search={{ favorite: true }} className="text-lg font-medium hover:underline">
                Favorites ({media.total_favorites})
            </Link>
            {media.total_favorites === 0 ?
                <MutedText>No favorites added yet</MutedText>
                :
                <div className="grid grid-cols-10 max-sm:grid-cols-5 gap-1">
                    {media.favorites.map(m =>
                        <BlockLink key={m.media_name} to={`/details/${media.media_type}/${m.media_id}`} className="col-span-1 md:col-span-1 mt-2">
                            <Tooltip text={m.media_name}>
                                <img
                                    alt={m.media_name}
                                    src={m.media_cover}
                                    id={`${media.media_type}-${m.media_id}`}
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
