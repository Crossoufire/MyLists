import {Fragment} from "react";
import {Link} from "react-router-dom";
import {Badge} from "@/components/ui/badge";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {capitalize, getStatusColor} from "@/lib/utils";
import {RatingDistribution} from "@/components/profile/RatingDistribution";


export const MediaStats = ({ user, media }) => (
    <div className="flex flex-col gap-4 mt-3 px-4 pb-3">
        <div>
            <div className="flex justify-between font-medium">
                <div>{capitalize(media.media_type)}</div>
                <div>{parseInt(media.time_days)} days</div>
            </div>
            <Separator/>
            <div className="flex flex-wrap justify-between text-center font-medium">
                <div>
                    <div className="text-neutral-500">Hours</div>
                    <div>{media.time_hours}</div>
                </div>
                {media.media_type !== "games" &&
                    <div>
                        <div className="text-neutral-500">
                            {media.media_type === "books" && <>Pages</>}
                            {media.media_type === "movies" && <>Watched</>}
                            {["series", "anime"].includes(media.media_type) && <>Episodes</>}
                        </div>
                        <div>{media.specific_total}</div>
                    </div>
                }
                <div>
                    <div className="text-neutral-500">Media</div>
                    <div>{media.total_media}</div>
                </div>
                {!user.add_feeling &&
                    <div>
                        <div className="text-neutral-500">Score</div>
                        <div>{media.mean_metric.toFixed(2)}</div>
                    </div>
                }
                <div>
                    <div className="text-neutral-500">Scored</div>
                    <div>{media.media_metric}/{media.total_media}</div>
                </div>
            </div>
            <div className="flex h-8 mt-2 mb-2">
                {media.no_data ?
                    <span className="flex-grow bg-black rounded-md"/>
                    :
                    media.status_count.map(status =>
                        <Tooltip key={`${status.status}-${media.media_type}`} text={status.status}>
                            <span
                                className="flex-grow"
                                style={{width: `${status.percent}%`,
                                backgroundColor: getStatusColor(status.status)}}
                            />
                        </Tooltip>
                    )
                }
            </div>
            <div className="grid grid-cols-2 font-medium gap-y-2 gap-x-8 px-2">
                {media.status_count.map(s =>
                    <Fragment key={`${s.status}-${media.media_type}`}>
                        <div className="col-span-1 flex justify-between">
                            <Link to={`/list/${media.media_type}/${user.username}?status=${s.status}`} className="text-neutral-500">
                                <div
                                    className="inline-block mr-[8px] w-[10px] h-[10px] rounded-full"
                                    style={{backgroundColor: getStatusColor(s.status)}}
                                />
                                {s.status}
                            </Link>
                            <div>{s.count}</div>
                        </div>
                    </Fragment>
                )}
            </div>
        </div>
        <div>
            <Link to={`/list/${media.media_type}/${user.username}?status=Favorite`} className="text-lg font-medium
            hover:underline hover:underline-offset-2">
                Favorites ({media.total_favorites})
            </Link>
            {media.total_favorites === 0 ?
                <div className="text-muted-foreground mt-2.5 italic">No favorites added yet</div>
                :
                <div className="flex flex-wrap justify-start gap-2 mt-2">
                    {media.favorites.map(m =>
                        <Link key={m.media_name} to={`/details/${media.media_type}/${m.media_id}`}>
                            <Tooltip text={m.media_name}>
                                <img
                                    id={`${media.media_type}-${m.media_id}`}
                                    src={m.media_cover}
                                    className="h-[78px] w-[52px] rounded-sm"
                                    alt={m.media_name}
                                />
                            </Tooltip>
                        </Link>
                    )}
                </div>
            }
        </div>
        <RatingDistribution
            isFeeling={user.add_feeling}
            ratingCount={media.count_per_metric}
            mediaType={media.media_type}
        />
        <div>
            <Link to={`/list/${media.media_type}/${user.username}?status=Labels`} className="text-lg font-medium
            hover:underline hover:underline-offset-2">
                Labels ({media.labels.count})
            </Link>
            {media.labels.names.length === 0 ?
                <div className="text-muted-foreground mt-2.5 italic">No labels created yet</div>
                :
                <div className="flex flex-wrap justify-start gap-2 mt-2">
                    {media.labels.names.map(lb =>
                        <Link key={lb} to={`/list/${media.media_type}/${user.username}?status=Labels&label_name=${lb}`}>
                            <Badge variant="label" className="font-semibold">{lb}</Badge>
                        </Link>
                    )}
                </div>
            }
        </div>
        <Link to={`/list/${media.media_type}/${user.username}?status=Stats`} className="text-lg font-medium
        hover:underline hover:underline-offset-2">
            More stats
        </Link>
    </div>
);
