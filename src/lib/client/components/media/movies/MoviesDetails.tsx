import {Star} from "lucide-react";
import {JobType, MediaType} from "@/lib/utils/enums";
import {Synopsis} from "@/lib/client/components/media/base/Synopsis";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {MapDetails} from "@/lib/client/components/media/base/MapDetails";
import {formatDateTime, formatMinutes, getLangCountryName} from "@/lib/utils/functions";
import {GenericDetails} from "@/lib/client/components/media/base/GenericDetails";


type MoviesDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaDetails"]>[0];


export const MoviesDetails = ({ mediaType, mediaData }: MoviesDetailsProps<typeof MediaType.MOVIES>) => {
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
                            name="Director"
                            job={JobType.CREATOR}
                            mediaType={mediaType}
                            dataList={[{ name: mediaData.directorName }]}
                        />
                        <GenericDetails
                            name="Release date"
                            value={formatDateTime(mediaData.releaseDate, { noTime: true })}
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
                            job={JobType.ACTOR}
                            mediaType={mediaType}
                            dataList={mediaData?.actors ?? []}
                        />
                        <MapDetails
                            name="Compositor"
                            mediaType={mediaType}
                            job={JobType.COMPOSITOR}
                            dataList={[{ name: mediaData.compositorName }]}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="VO"
                            value={getLangCountryName(mediaData?.originalLanguage, "language")}
                        />
                        <MapDetails
                            name="Genres"
                            dataList={mediaData?.genres ?? []}
                        />
                    </div>
                </div>
            </div>
            <Synopsis
                tagLine={mediaData.tagline}
                synopsis={mediaData.synopsis}
            />
        </>
    );
}
