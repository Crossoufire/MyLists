import {Link} from "@tanstack/react-router";
import {SimpleMedia} from "@/lib/types/base.types";
import {MediaType} from "@/lib/server/utils/enums";
import {MutedText} from "@/lib/components/general/MutedText";
import {MediaTitle} from "@/lib/components/media/base/MediaTitle";
import {Tooltip, TooltipContent, TooltipTrigger} from "@/lib/components/ui/tooltip";


interface SimilarMediaProps {
    title: string;
    mediaType: MediaType;
    similarMedia: SimpleMedia[];
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
                    similarMedia.map((media) =>
                        <div key={media.mediaId} className="col-span-3 md:col-span-2">
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <Link
                                        search={{ external: false }}
                                        to="/details/$mediaType/$mediaId"
                                        params={{ mediaType, mediaId: media.mediaId }}
                                    >
                                        <img
                                            alt={media.mediaName}
                                            src={media.mediaCover}
                                            className="rounded-sm"
                                        />
                                    </Link>
                                </TooltipTrigger>
                                <TooltipContent>
                                    {media.mediaName}
                                </TooltipContent>
                            </Tooltip>
                        </div>
                    )}
            </div>
        </div>
    );
};
