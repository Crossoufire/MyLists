import {ArrowRight} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/general/MutedText";
import {BlockLink} from "@/lib/components/general/BlockLink";
import {StatusBullet} from "@/lib/components/general/StatusBullet";
import {getFeelingIcon, getStatusColor} from "@/lib/utils/functions";
import {MediaType, RatingSystemType, Status} from "@/lib/server/utils/enums";
import {profileOptions} from "@/lib/react-query/query-options/query-options";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/components/ui/tooltip";
import {useIsMobile} from "@/lib/hooks/use-mobile";


interface MediaStatsProps {
    user: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["userData"];
    media: Awaited<ReturnType<NonNullable<ReturnType<typeof profileOptions>["queryFn"]>>>["perMediaSummary"][0];
}


export const MediaStats = ({ media, user }: MediaStatsProps) => {
    return (
        <div>
            <div className="flex flex-wrap justify-between text-center font-medium max-sm:text-sm">
                <MediaValues
                    title="Time"
                    value={media.timeSpentDays.toFixed(1) + " d"}
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
                        media.avgRated?.toFixed(2) ?? "-"
                        :
                        getFeelingIcon(media.avgRated, { size: 16, className: "mt-1" })
                    }
                />
                <MediaValues
                    title="Rated"
                    value={`${media.entriesRated}/${media.totalNoPlan}`}
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
                    Advanced Stats <ArrowRight className="inline-block ml-1 w-4 h-4"/>
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


function MediaStatuses({ media, username }: { media: MediaStatsProps["media"], username: string }) {
    return (
        <div>
            <div className="flex h-8 mb-2 mt-2 max-sm:h-6">
                {media.noData ?
                    <span className="grow bg-black"/>
                    :
                    media.statusList.map((st, idx: number) =>
                        <Tooltip key={idx}>
                            <TooltipTrigger asChild>
                                <span
                                    className="grow"
                                    style={{
                                        width: `${st.percent}%`,
                                        backgroundColor: getStatusColor(st.status as Status),
                                    }}
                                />
                            </TooltipTrigger>
                            <TooltipContent>
                                {st.status}
                            </TooltipContent>
                        </Tooltip>
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


function MediaFavorites({ media, username }: { media: MediaStatsProps["media"], username: string }) {
    const isMobile = useIsMobile();
    const maxFavorites = isMobile ? 5 : 10;

    return (
        <div className="mt-4">
            <Link
                search={{ favorite: true }}
                to="/list/$mediaType/$username"
                params={{ mediaType: media.mediaType, username }}
                className="text-lg font-medium hover:underline max-sm:text-base"
            >
                Favorites ({media.EntriesFavorites})
            </Link>
            {media.EntriesFavorites === 0 ?
                <MutedText>No favorites added yet</MutedText>
                :
                <div className="grid grid-cols-10 max-sm:grid-cols-5 gap-1">
                    {media.favoritesList.slice(0, maxFavorites).map((m) =>
                        <Tooltip key={m.mediaId}>
                            <TooltipTrigger asChild>
                                <BlockLink
                                    key={m.mediaName}
                                    to="/details/$mediaType/$mediaId"
                                    className="col-span-1 md:col-span-1 mt-2"
                                    params={{ mediaType: media.mediaType, mediaId: m.mediaId }}
                                >
                                    <img
                                        alt={m.mediaName}
                                        src={m.mediaCover}
                                        id={`${media.mediaType}-${m.mediaId}`}
                                        className="h-[78px] w-[52px] rounded-sm"
                                    />
                                </BlockLink>
                            </TooltipTrigger>
                            <TooltipContent>
                                {m.mediaName}
                            </TooltipContent>
                        </Tooltip>
                    )}
                </div>
            }
        </div>
    );
}
