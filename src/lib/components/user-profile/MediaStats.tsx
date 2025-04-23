import {ArrowRight} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/app/MutedText";
import {BlockLink} from "@/lib/components/app/BlockLink";
import {profileOptions} from "@/lib/react-query/query-options";
import {getFeelingIcon, getStatusColor} from "@/lib/utils/functions";
import {MediaType, RatingSystemType} from "@/lib/server/utils/enums";
import {StatusBullet} from "@/lib/components/user-profile/StatusBullet";


interface MediaStatsProps {
    user: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userData"];
    media: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["perMediaSummary"][0];
}


export const MediaStats = ({ media, user }: MediaStatsProps) => {
    return (
        <div>
            <div className="flex flex-wrap justify-between text-center font-medium max-sm:text-sm">
                <MediaValues
                    title="Time (d)"
                    value={media.timeSpentDays}
                />
                <SpecificMediaValues
                    value={media.totalSpecific}
                    mediaType={media.mediaType}
                />
                <MediaValues
                    title="Entries"
                    value={media.totalEntries}
                />
                <MediaValues
                    title="Avg. Rating"
                    value={user.ratingSystem === RatingSystemType.SCORE ?
                        media.entriesRated === 0 ? "--" : `${media.avgRated ? media.avgRated.toFixed(2) : "--"}`
                        :
                        getFeelingIcon(media.avgRated, { size: 16, className: "mt-1" })
                    }
                />
                <MediaValues
                    title="Rated"
                    value={`${media.avgRated?.toFixed(2)}/${media.totalNoPlan}`}
                />
            </div>
            <MediaStatuses
                media={media}
                username={user.name}
            />
            <MediaFavorites
                media={media}
                username={user.name}
            />
            <Separator className="mt-3 mb-1.5"/>
            <div className="flex items-center justify-end">
                <Link to={`/stats/$username`} params={{ username: user.name }} className="text-base font-medium hover:underline">
                    Advanced stats<ArrowRight className="inline-block ml-1 w-4 h-4"/>
                </Link>
            </div>
        </div>
    );
};


function MediaValues({ title, value }: { title: string, value: any }) {
    return (
        <div>
            <div className="text-neutral-500">{title}</div>
            <div className="flex items-center justify-center">{value}</div>
        </div>
    );
}


function SpecificMediaValues({ mediaType, value }: { mediaType: MediaType, value: any }) {
    return (
        <>
            {mediaType === MediaType.MANGA && <MediaValues title="Chapters" value={value}/>}
            {mediaType === MediaType.BOOKS && <MediaValues title="Pages" value={value}/>}
            {mediaType === MediaType.MOVIES && <MediaValues title="(Re)watched" value={value}/>}
            {["series", "anime"].includes(mediaType) && <MediaValues title="Episodes" value={value}/>}
        </>
    );
}


function MediaStatuses({ media, username }: { media: any, username: string }) {
    return (
        <div>
            <div className="flex h-8 mb-2 mt-2 max-sm:h-6">
                {media.noData ?
                    <span className="grow bg-black"/>
                    :
                    media.statusList.map((st: any, idx: number) =>
                        <Tooltip key={idx} text={st.status}>
                            <span
                                style={{ width: `${st.percent}%`, backgroundColor: getStatusColor(st.status) }}
                                className={"grow"}
                            />
                        </Tooltip>,
                    )
                }
            </div>
            <div className="grid grid-cols-2 font-medium gap-y-2 gap-x-8 px-2 max-sm:px-0 max-sm:text-xs">
                {media.statusList.map((st: any, idx: number) =>
                    <div key={idx} className="flex justify-between">
                        <Link
                            to={"/list/$mediaType/$username"}
                            params={{ mediaType: media.mediaType, username }}
                            search={{ status: [st.status] }}
                            className="text-neutral-500"
                        >
                            <StatusBullet status={st.status}/> {st.status}
                        </Link>
                        <div>{st.count}</div>
                    </div>,
                )}
            </div>
        </div>
    );
}


function MediaFavorites({ media, username }: { media: any, username: string }) {
    return (
        <div className="mt-4">
            <Link
                to={"/list/$mediaType/$username"}
                params={{ mediaType: media.mediaType, username }}
                search={{ favorite: true }}
                className="text-lg font-medium hover:underline"
            >
                Favorites ({media.EntriesFavorites})
            </Link>
            {media.EntriesFavorites === 0 ?
                <MutedText>No favorites added yet</MutedText>
                :
                <div className="grid grid-cols-10 max-sm:grid-cols-5 gap-1">
                    {media.favoritesList.map((m: any) =>
                        <BlockLink key={m.mediaName} to={`/details/${media.mediaType}/${m.mediaId}`} className="col-span-1 md:col-span-1 mt-2">
                            <Tooltip text={m.mediaName}>
                                <img
                                    alt={m.mediaName}
                                    src={m.mediaCover}
                                    id={`${media.mediaType}-${m.mediaId}`}
                                    className="h-[78px] w-[52px] rounded-sm"
                                />
                            </Tooltip>
                        </BlockLink>,
                    )}
                </div>
            }
        </div>
    );
}
