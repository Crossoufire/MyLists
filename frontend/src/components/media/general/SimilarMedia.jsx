import {capitalize} from "@/lib/utils";
import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/components/ui/tooltip";
import {MediaTitle} from "@/components/media/general/MediaTitle";


export const SimilarMedia = ({ mediaType, similarMedia }) => {
    return (
        <div className="mt-7">
            <MediaTitle>Similar {capitalize(mediaType)}</MediaTitle>
            <div className="grid grid-cols-12 gap-2">
                {similarMedia.length === 0 ?
                    <div className="col-span-12">
                        <div className="text-muted-foreground italic">No similar media to display</div>
                    </div>
                    :
                    similarMedia.map(media =>
                        <div key={media.media_id} className="col-span-3 md:col-span-2">
                            <Link to={`/details/${mediaType}/${media.media_id}`}>
                                <Tooltip text={media.media_name}>
                                    <img
                                        src={media.media_cover}
                                        className="rounded-sm"
                                        alt={media.media_name}
                                    />
                                </Tooltip>
                            </Link>
                        </div>
                    )}
            </div>
        </div>
    );
};
