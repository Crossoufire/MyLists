import {Star} from "lucide-react";
import {Synopsis} from "@/components/media-details/Synopsis";
import {MapDetails} from "@/components/media-details/MapDetails";
import {GenericDetails} from "@/components/media-details/GenericDetails";
import {capitalize, formatDateTime, formatMinutes} from "@/utils/functions";


export const MangaDetails = ({ mediaData, mediaType }) => {
    console.log(mediaData);
    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">MAL Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/> {mediaData.vote_average.toFixed(1)} ({mediaData.vote_count})
                            </div>
                        </div>
                        <MapDetails
                            job="creator"
                            name="Authors"
                            mediaType={mediaType}
                            valueList={mediaData.authors}
                        />
                        <GenericDetails
                            name="Airing dates"
                            value={
                                <>
                                    {formatDateTime(mediaData.release_date, { useLocalTz: true })}
                                    <br/>
                                    {formatDateTime(mediaData.end_date, { useLocalTz: true })}
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
                            value={formatMinutes(mediaData.chapters * 7)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Original Name"
                            value={mediaData.original_name}
                        />
                        <GenericDetails
                            name="Prod. Status"
                            value={capitalize(mediaData.prod_status.toLowerCase())}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            job="publisher"
                            name="Publisher"
                            mediaType={mediaType}
                            valueList={[mediaData.publishers]}
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
        </div>
    );
};
