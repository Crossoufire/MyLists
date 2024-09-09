import {Link} from "@tanstack/react-router";
import {Tooltip} from "@/components/ui/tooltip";
import {MutedText} from "@/components/app/base/MutedText";
import {MediaTitle} from "@/components/media/general/MediaTitle";
import {capitalize} from "@/utils/functions.jsx";


export const SimilarMedia = ({ mediaType, similarMedia }) => {
    return (
        <div className="mt-7">
            <MediaTitle>Similar {capitalize(mediaType)}</MediaTitle>
            <div className="grid grid-cols-12 gap-2">
                {similarMedia.length === 0 ?
                    <div className="col-span-12">
                        <MutedText>No similar media to display</MutedText>
                    </div>
                    :
                    similarMedia.map(media =>
                        <div key={media.media_id} className="col-span-3 md:col-span-2">
                            <Link to={`/details/${mediaType}/${media.media_id}`}>
                                <Tooltip text={media.media_name}>
                                    <img
                                        alt={media.media_name}
                                        src={media.media_cover}
                                        className={"rounded-sm"}
                                    />
                                </Tooltip>
                            </Link>
                        </div>
                    )}
            </div>
        </div>
    );
};
