import {Star} from "lucide-react";
import {JobType, MediaType} from "@/lib/server/utils/enums";
import {Synopsis} from "@/lib/components/media/base/Synopsis";
import {ExtractMediaDetailsByType} from "@/lib/components/types";
import {MapDetails} from "@/lib/components/media/base/MapDetails";
import {EpsPerSeason} from "@/lib/components/media/tv/EpsPerSeason";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {GenericDetails} from "@/lib/components/media/base/GenericDetails";


interface TvDetailsProps {
    mediaType: MediaType;
    mediaData: ExtractMediaDetailsByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
}


export const TvDetails = ({ mediaType, mediaData }: TvDetailsProps) => {
    const creators = mediaData.createdBy?.split(", ").map(c => ({ name: c })) || [];

    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">TMDB Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/>
                                {mediaData.voteAverage ? mediaData.voteAverage.toFixed(1) : "--"} ({mediaData.voteCount})
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
                                    {formatDateTime(mediaData.releaseDate, { useLocalTz: true })}
                                    <br/>
                                    {formatDateTime(mediaData.lastAirDate, { useLocalTz: true })}
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
                            value={mediaData.originCountry}
                        />
                        {mediaData.nextEpisodeToAir &&
                            <GenericDetails
                                name="Next Airing"
                                value={formatDateTime(mediaData.nextEpisodeToAir)}
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
            <EpsPerSeason
                epsPerSeason={mediaData.epsPerSeason ?? []}
            />
        </div>
    );
};
