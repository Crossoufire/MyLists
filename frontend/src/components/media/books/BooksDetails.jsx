import {Synopsis} from "@/components/media/general/Synopsis";
import {MapDetails} from "@/components/media/general/MapDetails";
import {GenericDetails} from "@/components/media/general/GenericDetails";
import {capitalize, formatDateTime, formatMinutes} from "@/utils/functions";


export const BooksDetails = ({ mediaData, mediaType }) => {
    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            job="creator"
                            name="Authors"
                            mediaType={mediaType}
                            valueList={mediaData.authors}
                        />
                        <GenericDetails
                            name="Release date"
                            value={formatDateTime(mediaData.release_date, { onlyYear: true })}
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
                            value={formatMinutes(mediaData.pages * 1.7, { format: "hm" })}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
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
        </div>
    );
};
