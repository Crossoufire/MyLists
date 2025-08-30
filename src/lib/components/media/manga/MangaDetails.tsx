import {JobType, MediaType} from "@/lib/server/utils/enums";
import {Synopsis} from "@/lib/components/media/base/Synopsis";
import {MediaConfiguration} from "@/lib/components/media/media-config";
import {MapDetails} from "@/lib/components/media/base/MapDetails";
import {GenericDetails} from "@/lib/components/media/base/GenericDetails";
import {capitalize, formatDateTime, formatMinutes} from "@/lib/utils/functions";


type MangaDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaDetails"]>[0];


export const MangaDetails = ({ mediaType, mediaData }: MangaDetailsProps<typeof MediaType.MANGA>) => {
    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Authors"
                            job={JobType.CREATOR}
                            mediaType={mediaType}
                            dataList={mediaData.authors ?? []}
                        />
                        <GenericDetails
                            name="Airing dates"
                            value={
                                <>
                                    {formatDateTime(mediaData.releaseDate, { useLocalTz: true })}
                                    <br/>
                                    {formatDateTime(mediaData.endDate, { useLocalTz: true })}
                                </>
                            }
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Chapters"
                            value={mediaData.chapters}
                        />
                        <GenericDetails
                            name="Volumes"
                            value={mediaData.volumes}
                        />
                        <GenericDetails
                            name="Completion"
                            value={formatMinutes(mediaData.chapters ? mediaData.chapters * 7 : null)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Original Name"
                            value={mediaData.originalName}
                        />
                        <GenericDetails
                            name="Prod. Status"
                            value={capitalize(mediaData?.prodStatus?.toLowerCase())}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Publisher"
                            mediaType={mediaType}
                            job={JobType.PUBLISHER}
                            dataList={[{ name: mediaData.publishers }]}
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
        </div>
    );
}
