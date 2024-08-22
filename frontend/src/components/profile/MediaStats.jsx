import {Link} from "@tanstack/react-router";
import {Badge} from "@/components/ui/badge";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {BulletIcon} from "@/components/app/base/BulletIcon";
import {capitalize, formatTimeTo, getStatusColor} from "@/lib/utils";
import {RatingDistribution} from "@/components/profile/RatingDistribution";
import {MutedText} from "@/components/app/base/MutedText.jsx";


export const MediaStats = ({ user, media }) => (
    <div className="flex flex-col gap-4 mt-3 px-4 pb-3">
        <div>
            <div className="flex justify-between font-medium">
                <div>{capitalize(media.media_type)}</div>
                <div>{formatTimeTo("days", media.time_spent)} days</div>
            </div>
            <Separator/>
            <div className="flex flex-wrap justify-between text-center font-medium">
                <div>
                    <div className="text-neutral-500">Hours</div>
                    <div>{formatTimeTo("hours", media.time_spent)}</div>
                </div>
                {media.media_type !== "games" &&
                    <div>
                        <div className="text-neutral-500">
                            {media.media_type === "books" && "Pages"}
                            {media.media_type === "movies" && "Watched"}
                            {["series", "anime"].includes(media.media_type) && "Episodes"}
                        </div>
                        <div>{media.specific_total}</div>
                    </div>
                }
                <div>
                    <div className="text-neutral-500">Entries</div>
                    <div>{media.rating.total_media}</div>
                </div>
                {user.rating_system !== "feeling" &&
                    <div>
                        <div className="text-neutral-500">Avg. Rating</div>
                        <div>{media.rating.mean_rating.toFixed(2)}</div>
                    </div>
                }
                <div>
                    <div className="text-neutral-500"># Rated</div>
                    <div>{media.rating.total_rated} / {media.rating.total_media}</div>
                </div>
            </div>
            <div className="flex h-8 mt-2 mb-2">
                {media.status_count.no_data ?
                    <span className="flex-grow bg-black rounded-md"/>
                    :
                    media.status_count.status_count.map(status =>
                        <Tooltip key={`${status.status}-${media.media_type}`} text={status.status}>
                            <span
                                className="flex-grow"
                                style={{width: `${status.percent}%`, backgroundColor: getStatusColor(status.status)}}
                            />
                        </Tooltip>
                    )
                }
            </div>
            <div className="grid grid-cols-2 font-medium text-sm gap-y-2 gap-x-8 md:text-base md:px-2">
                {media.status_count.status_count.map(s =>
                    <div key={`${s.status}-${media.media_type}`} className="flex justify-between">
                        <Link to={`/list/${media.media_type}/${user.username}?status=${s.status}`} className="text-neutral-500">
                            <BulletIcon color={getStatusColor(s.status)}/> {s.status}
                        </Link>
                        <div>{s.count}</div>
                    </div>
                )}
            </div>
        </div>
        <div>
            <Link to={`/list/${media.media_type}/${user.username}?favorite=true`} className="text-lg font-medium
            hover:underline hover:underline-offset-2">
                Favorites ({media.favorites.total_favorites})
            </Link>
            {media.favorites.total_favorites === 0 ?
                <MutedText text="No favorites added yet" className="mt-2.5"/>
                :
                <div className="flex flex-wrap justify-start gap-2 mt-2">
                    {media.favorites.favorites.map(m =>
                        <Link key={m.media_name} to={`/details/${media.media_type}/${m.media_id}`}>
                            <Tooltip text={m.media_name}>
                                <img
                                    alt={m.media_name}
                                    src={m.media_cover}
                                    id={`${media.media_type}-${m.media_id}`}
                                    className={"h-[78px] w-[52px] rounded-sm"}
                                />
                            </Tooltip>
                        </Link>
                    )}
                </div>
            }
        </div>
        <RatingDistribution
            mediaType={media.media_type}
            ratingCount={media.rating_count}
            ratingSystem={user.rating_system}
        />
        <div>
            <div className="font-medium text-lg">
                Labels ({media.labels.length})
            </div>
            {media.labels.length === 0 ?
                <MutedText text="No labels created yet" className="mt-2.5"/>
                :
                <div className="flex flex-wrap justify-start gap-2 mt-2">
                    {media.labels.map(lb =>
                        <Link key={lb} to={`/list/${media.media_type}/${user.username}?labels=${lb}`}>
                            <Badge variant="label" className="font-semibold">{lb}</Badge>
                        </Link>
                    )}
                </div>
            }
        </div>
        <Link to={`/stats/${media.media_type}/${user.username}`} className="text-lg font-medium hover:underline
        hover:underline-offset-2">
            Detailed stats
        </Link>
    </div>
);
