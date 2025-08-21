import {JobType, MediaType} from "@/lib/server/utils/enums";
import {Synopsis} from "@/lib/components/media/base/Synopsis";
import {ExtractMediaDetailsByType} from "@/lib/components/types";
import {MapDetails} from "@/lib/components/media/base/MapDetails";
import {GenericDetails} from "@/lib/components/media/base/GenericDetails";
import {capitalize, formatDateTime, formatMinutes} from "@/lib/utils/functions";


interface BooksDetailsProps {
    mediaType: MediaType;
    mediaData: ExtractMediaDetailsByType<typeof MediaType.BOOKS>;
}


export const BooksDetails = ({ mediaType, mediaData }: BooksDetailsProps) => {
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
                            name="Release date"
                            value={formatDateTime(mediaData.releaseDate, { onlyYear: true, useLocalTz: true })}
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
        </div>
    );
}
