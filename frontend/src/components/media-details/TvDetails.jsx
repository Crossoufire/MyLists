import {Star} from "lucide-react";
import {Synopsis} from "@/components/media-details/Synopsis";
import {formatDateTime, formatMinutes} from "@/utils/functions";
import {MapDetails} from "@/components/media-details/MapDetails";
import {MediaTitle} from "@/components/media-details/MediaTitle";
import {GenericDetails} from "@/components/media-details/GenericDetails";


export const TvDetails = ({ mediaData, mediaType }) => {
    const creators = mediaData.created_by?.split(", ") || [];

    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">TMDB Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/> {mediaData.vote_average.toFixed(1)} ({mediaData.vote_count})
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
                                    {formatDateTime(mediaData.release_date, { useLocalTz: true })}
                                    <br/>
                                    {formatDateTime(mediaData.last_air_date, { useLocalTz: true })}
                                </>
                            }
                        />
                        <GenericDetails
                            name="Prod. Status"
                            value={mediaData.prod_status}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Eps. duration"
                            value={`${mediaData.duration} min`}
                        />
                        <GenericDetails
                            name="Seasons"
                            value={`${mediaData.total_seasons} seasons`}
                        />
                        <GenericDetails
                            name="Episodes"
                            value={`${mediaData.total_episodes} episodes`}
                        />
                        <GenericDetails
                            name="Completion"
                            value={formatMinutes(mediaData.total_episodes * mediaData.duration)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Actors"
                            job="actor"
                            mediaType={mediaType}
                            valueList={mediaData.actors}
                        />
                        <GenericDetails
                            name="Origin"
                            value={mediaData.origin_country}
                        />
                        {mediaData.next_episode_to_air &&
                            <GenericDetails
                                name="Next Airing"
                                value={formatDateTime(mediaData.next_episode_to_air)}
                            />
                        }
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            job="platform"
                            name="Networks"
                            mediaType={mediaType}
                            valueList={mediaData.networks}
                        />
                        <MapDetails
                            name="Genres"
                            valueList={mediaData.genres}
                        />
                    </div>
                </div>
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
            <EpsPerSeason
                epsDuration={mediaData.duration}
                epsPerSeason={mediaData.eps_per_season}
            />
        </div>
    );
};


function EpsPerSeason({ epsPerSeason }) {
    return (
        <div>
            <MediaTitle>Episodes/Seasons</MediaTitle>
            <div className="grid grid-cols-12 gap-3 pr-2 overflow-y-auto max-h-[224px]">
                {epsPerSeason.map((val, idx) =>
                    <div key={idx} className="col-span-4 md:col-span-2 p-2 bg-cyan-900 rounded-md">
                        <div className="font-medium">Season {idx + 1}</div>
                        <div>{val} Eps</div>
                    </div>
                )}
            </div>
        </div>
    );
}