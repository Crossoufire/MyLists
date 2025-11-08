import {Star} from "lucide-react";
import {JobType, MediaType} from "@/lib/utils/enums";
import {Synopsis} from "@/lib/client/components/media/base/Synopsis";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {MapDetails} from "@/lib/client/components/media/base/MapDetails";
import {formatDateTime, formatMinutes, getLangCountryName, zeroPad} from "@/lib/utils/functions";
import {GenericDetails} from "@/lib/client/components/media/base/GenericDetails";
import {DisplayAllEpsPerSeason} from "@/lib/client/components/media/tv/DisplayAllEpsPerSeason";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaDetails"]>[number];


export const TvDetails = ({ mediaType, mediaData }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    const creators = mediaData.createdBy?.split(", ").map(c => ({ name: c })) || [];

    return (
        <>
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">TMDB Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/>
                                {mediaData.voteAverage ? mediaData.voteAverage.toFixed(1) : "-"} ({mediaData.voteCount})
                            </div>
                        </div>
                        <MapDetails
                            name="Created by"
                            dataList={creators}
                            job={JobType.CREATOR}
                            mediaType={mediaType}
                        />
                        <GenericDetails
                            name="Airing dates"
                            value={
                                <>
                                    {formatDateTime(mediaData.releaseDate, { noTime: true })}
                                    <br/>
                                    {formatDateTime(mediaData.lastAirDate, { noTime: true })}
                                </>
                            }
                        />
                        <GenericDetails
                            name="Prod. Status"
                            value={mediaData.prodStatus}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Eps. duration"
                            value={`${mediaData.duration} min`}
                        />
                        <GenericDetails
                            name="Seasons"
                            value={`${mediaData.totalSeasons} seasons`}
                        />
                        <GenericDetails
                            name="Episodes"
                            value={`${mediaData.totalEpisodes} episodes`}
                        />
                        <GenericDetails
                            name="Completion"
                            value={formatMinutes(mediaData.totalEpisodes * mediaData.duration)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Actors"
                            job={JobType.ACTOR}
                            mediaType={mediaType}
                            dataList={mediaData.actors ?? []}
                        />
                        <GenericDetails
                            name="Origin"
                            value={getLangCountryName(mediaData.originCountry, "region")}
                        />
                        {mediaData.nextEpisodeToAir &&
                            <GenericDetails
                                name="Next Airing"
                                value={
                                    <div>
                                        <div>S{zeroPad(mediaData.seasonToAir)}.E{zeroPad(mediaData.episodeToAir)}</div>
                                        <div>{formatDateTime(mediaData.nextEpisodeToAir, { noTime: true })}</div>
                                    </div>
                                }
                            />
                        }
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Networks"
                            mediaType={mediaType}
                            job={JobType.PLATFORM}
                            dataList={mediaData.networks ?? []}
                        />
                        <MapDetails
                            name="Genres"
                            dataList={mediaData.genres}
                        />
                    </div>
                </div>
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
            <DisplayAllEpsPerSeason
                epsPerSeason={mediaData.epsPerSeason ?? []}
            />
        </>
    );
};
