import {MediaType} from "@/lib/utils/enums";
import {SimpleMedia} from "@/lib/types/base.types";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";


interface SimilarMediaProps {
    item: SimpleMedia;
    mediaType: MediaType;
}


export const SimilarMediaCard = ({ mediaType, item }: SimilarMediaProps) => {
    const newItem = { ...item, imageCover: item.mediaCover };

    return (
        <MediaCard mediaType={mediaType} item={newItem}>
            <div className="absolute bottom-0 w-full rounded-b-sm p-3 pb-2">
                <div className="flex w-full items-center justify-between text-sm">
                    <h3 className="grow truncate font-semibold text-primary" title={item.mediaName}>
                        {item.mediaName}
                    </h3>
                </div>
            </div>
        </MediaCard>
    );
}
