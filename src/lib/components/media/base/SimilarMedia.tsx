import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/server/utils/enums";
import {Tooltip} from "@/lib/components/ui/tooltip";
import {MutedText} from "@/lib/components/app/MutedText";
import {MediaTitle} from "@/lib/components/media/base/MediaTitle";


interface SimilarMediaProps {
    title: string;
    mediaType: MediaType;
    similarMedia: Array<any>;
}


export const SimilarMedia = ({ title, mediaType, similarMedia }: SimilarMediaProps) => {
    return (
        <div className="mt-7">
            <MediaTitle>{title}</MediaTitle>
            <div className="grid grid-cols-12 gap-2">
                {similarMedia.length === 0 ?
                    <div className="col-span-12">
                        <MutedText>No similar media to display</MutedText>
                    </div>
                    :
                    similarMedia.map(media =>
                        <div key={media.media_id} className="col-span-3 md:col-span-2">
                            <Link to="/details/$mediaType/$mediaId" params={{ mediaType, mediaId: media.mediaId }} search={{ external: false }}>
                                <Tooltip text={media.mediaName}>
                                    <img
                                        alt={media.mediaName}
                                        src={media.mediaCover}
                                        className={"rounded-sm"}
                                    />
                                </Tooltip>
                            </Link>
                        </div>,
                    )}
            </div>
        </div>
    );
};
