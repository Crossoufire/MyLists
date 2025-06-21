import {Star} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {Synopsis} from "@/lib/components/media-details/Synopsis";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MapDetails} from "@/lib/components/media-details/MapDetails";
import {EpsPerSeason} from "@/lib/components/media-details/EpsPerSeason";
import {GenericDetails} from "@/lib/components/media-details/GenericDetails";


interface TvDetailsProps {
    mediaData: any;
    mediaType: MediaType;
}


export const TvDetails = ({ mediaData, mediaType }: TvDetailsProps) => {
    const creators = mediaData.createdBy?.split(", ") || [];

    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">TMDB Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/> {mediaData.voteAverage.toFixed(1)} ({mediaData.voteCount})
                            </div>
                        </div>
                        <MapDetails
                            job="creator"
                            name="Created by"
                            valueList={creators}
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
                            job="actor"
                            mediaType={mediaType}
                            valueList={mediaData.actors.map((actor: any) => actor.name)}
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
                            job="platform"
                            name="Networks"
                            mediaType={mediaType}
                            valueList={mediaData.networks.map((net: any) => net.name)}
                        />
                        <MapDetails
                            name="Genres"
                            valueList={mediaData.genres.map((genre: any) => genre.name)}
                        />
                    </div>
                </div>
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
            <EpsPerSeason
                epsPerSeason={mediaData.epsPerSeasons}
            />
        </div>
    );
};
