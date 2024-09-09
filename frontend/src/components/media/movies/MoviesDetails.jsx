import {FaStar} from "react-icons/fa";
import {Synopsis} from "@/components/media/general/Synopsis";
import {MapDetails} from "@/components/media/general/MapDetails";
import {GenericDetails} from "@/components/media/general/GenericDetails";
import {formatDateTime, formatMinutes} from "@/utils/functions.jsx";


export const MoviesDetails = ({ mediaType, mediaData }) => (
    <div className="flex flex-col gap-7 max-sm:mt-5">
        <div className="bg-card rounded-md p-4">
            <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                <div className="flex flex-col gap-y-4">
                    <div>
                        <div className="font-semibold text-neutral-500">TMDB Rating</div>
                        <div className="flex items-center gap-2">
                            <FaStar/> {mediaData.vote_average.toFixed(1)} ({mediaData.vote_count})
                        </div>
                    </div>
                    <MapDetails
                        name="Director"
                        job="creator"
                        mediaType={mediaType}
                        valueList={[mediaData.director_name]}
                    />
                    <GenericDetails
                        name="Release date"
                        value={formatDateTime(mediaData.release_date)}
                    />
                </div>
                <div className="flex flex-col gap-y-4">
                    <GenericDetails
                        name="Runtime"
                        value={formatMinutes(mediaData.duration, { format: "hm" })}
                    />
                    <GenericDetails
                        name="Budget"
                        value={parseFloat(mediaData.budget) === 0 ? mediaData.budget :
                            `${parseFloat(mediaData.budget).toLocaleString("fr")} $`}
                    />
                    <GenericDetails
                        name="Revenue"
                        value={parseFloat(mediaData.revenue) === 0 ? mediaData.revenue :
                            `${parseFloat(mediaData.revenue).toLocaleString("fr")} $`}
                    />
                </div>
                <div className="flex flex-col gap-y-4">
                    <MapDetails
                        name="Actors"
                        job="actor"
                        mediaType={mediaType}
                        valueList={mediaData.actors}
                    />
                </div>
                <div className="flex flex-col gap-y-4">
                    <GenericDetails
                        name="Origin"
                        value={mediaData.original_language.toUpperCase()}
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
            tagLine={mediaData.tagline}
        />
    </div>
);
