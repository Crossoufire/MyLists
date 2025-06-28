import {Star} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {Synopsis} from "@/lib/components/media/base/Synopsis";
import {mediaDetailsOptions} from "@/lib/react-query/query-options/query-options";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MapDetails} from "@/lib/components/media/base/MapDetails";
import {GenericDetails} from "@/lib/components/media/base/GenericDetails";


interface MoviesDetailsProps {
    mediaType: MediaType;
    mediaData: Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["media"];
}


export const MoviesDetails = ({ mediaType, mediaData }: MoviesDetailsProps) => (
    <div className="flex flex-col gap-7 max-sm:mt-5">
        <div className="bg-card rounded-md p-4">
            <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                <div className="flex flex-col gap-y-4">
                    <div>
                        <div className="font-semibold text-neutral-500">TMDB Rating</div>
                        <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-amber-500"/> {mediaData?.voteAverage?.toFixed(1)} ({mediaData.voteCount})
                        </div>
                    </div>
                    <MapDetails
                        job="creator"
                        name="Director"
                        mediaType={mediaType}
                        valueList={[mediaData.directorName]}
                    />
                    <GenericDetails
                        name="Release date"
                        value={formatDateTime(mediaData.releaseDate)}
                    />
                </div>
                <div className="flex flex-col gap-y-4">
                    <GenericDetails
                        name="Runtime"
                        value={formatMinutes(mediaData.duration)}
                    />
                    <GenericDetails
                        name="Budget"
                        value={mediaData.budget === 0 ? mediaData.budget : `${mediaData?.budget?.toLocaleString("fr")} $`}
                    />
                    <GenericDetails
                        name="Revenue"
                        value={mediaData.revenue === 0 ? mediaData.revenue : `${mediaData?.revenue?.toLocaleString("fr")} $`}
                    />
                </div>
                <div className="flex flex-col gap-y-4">
                    <MapDetails
                        name="Actors"
                        job="actor"
                        mediaType={mediaType}
                        // @ts-expect-error
                        valueList={mediaData.moviesActors.map(actor => actor.name)}
                    />
                    <MapDetails
                        job="compositor"
                        name="Compositor"
                        mediaType={mediaType}
                        valueList={[mediaData.compositorName]}
                    />
                </div>
                <div className="flex flex-col gap-y-4">
                    <GenericDetails
                        name="Origin"
                        value={mediaData?.originalLanguage?.toUpperCase()}
                    />
                    <MapDetails
                        name="Genres"
                        // @ts-expect-error
                        valueList={mediaData.moviesGenres.map(genre => genre.name)}
                    />
                </div>
            </div>
        </div>
        <Synopsis
            tagLine={mediaData.tagline}
            synopsis={mediaData.synopsis}
        />
    </div>
);
