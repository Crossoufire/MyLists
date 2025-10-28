import {JobType, MediaType} from "@/lib/utils/enums";
import {Synopsis} from "@/lib/client/components/media/base/Synopsis";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {MapDetails} from "@/lib/client/components/media/base/MapDetails";
import {GenericDetails} from "@/lib/client/components/media/base/GenericDetails";
import {capitalize, formatDateTime, formatMinutes} from "@/lib/utils/functions";


type BooksDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaDetails"]>[0];


export const BooksDetails = ({ mediaType, mediaData }: BooksDetailsProps<typeof MediaType.BOOKS>) => {
    return (
        <>
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
                            name="Release date"
                            value={formatDateTime(mediaData.releaseDate, { onlyYear: true })}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Publishers"
                            value={mediaData.publishers}
                        />
                        <GenericDetails
                            name="Language"
                            value={capitalize(mediaData.language)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Pages"
                            value={mediaData.pages}
                        />
                        <GenericDetails
                            name="Completion"
                            value={formatMinutes(mediaData.pages * 1.7)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Genres"
                            dataList={mediaData?.genres ?? []}
                        />
                    </div>
                </div>
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
        </>
    );
}
