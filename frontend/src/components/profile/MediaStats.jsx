import {ArrowRight} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/MutedText";
import {BlockLink} from "@/components/app/BlockLink";
import {StatusBullet} from "@/components/profile/StatusBullet";
import {getFeelingIcon, getStatusColor} from "@/utils/functions";


export const MediaStats = ({ media, user }) => {
    return (
        <div>
            <div className="flex flex-wrap justify-between text-center font-medium max-sm:text-sm">
                <MediaValues
                    title="Time (d)"
                    value={media.time_days}
                />
                <SpecificMediaValues
                    mediaType={media.media_type}
                    value={media.specific_total}
                />
                <MediaValues
                    title="Entries"
                    value={media.total_media}
                />
                <MediaValues
                    title="Avg. Rating"
                    value={user.rating_system === "score" ?
                        media.media_rated === 0 ? "--" : `${media.mean_rating.toFixed(2)}`
                        :
                        getFeelingIcon(media.mean_rating, { size: 16, className: "mt-1" })
                    }
                />
                <MediaValues
                    title="Rated"
                    value={`${media.media_rated}/${media.total_media_no_plan_to_x}`}
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
                <Link to={`/stats/${user.username}`} className="text-base font-medium hover:underline">
                    Advanced stats<ArrowRight className="inline-block ml-1 w-4 h-4"/>
                </Link>
            </div>
        </div>
    );
};


function MediaValues({ title, value }) {
    return (
        <div>
            <div className="text-neutral-500">{title}</div>
            <div className="flex items-center justify-center">{value}</div>
        </div>
    );
}


function SpecificMediaValues({ mediaType, value }) {
    return (
        <>
            {mediaType === "manga" && <MediaValues title="Chapters" value={value}/>}
            {mediaType === "books" && <MediaValues title="Pages" value={value}/>}
            {mediaType === "movies" && <MediaValues title="(Re)watched" value={value}/>}
            {["series", "anime"].includes(mediaType) && <MediaValues title="Episodes" value={value}/>}
        </>
    );
}


function MediaStatuses({ media, username }) {
    return (
        <div>
            <div className="flex h-8 mb-2 mt-2 max-sm:h-6">
                {media.no_data ?
                    <span className="flex-grow bg-black"/>
                    :
                    media.status_count.map((st, idx) =>
                        <Tooltip key={idx} text={st.status}>
                            <span
                                style={{ width: `${st.percent}%`, backgroundColor: getStatusColor(st.status) }}
                                className={"flex-grow"}
                            />
                        </Tooltip>
                    )
                }
            </div>
            <div className="grid grid-cols-2 font-medium gap-y-2 gap-x-8 px-2 max-sm:px-0 max-sm:text-xs">
                {media.status_count.map((st, idx) =>
                    <div key={idx} className="flex justify-between">
                        <Link to={`/list/${media.media_type}/${username}`} search={{ status: [st.status] }} className="text-neutral-500">
                            <StatusBullet status={st.status}/> {st.status}
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
