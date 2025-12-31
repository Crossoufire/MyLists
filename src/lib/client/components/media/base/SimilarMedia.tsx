import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {SimpleMedia} from "@/lib/types/base.types";


interface SimilarMediaProps {
    item: SimpleMedia;
    mediaType: MediaType;
}


export const SimilarMediaCard = ({ mediaType, item }: SimilarMediaProps) => {
    return (
        <Link
            search={{ external: false }}
            to="/details/$mediaType/$mediaId"
            params={{ mediaType, mediaId: item.mediaId }}
        >
            <div className="space-y-2 w-37 shrink-0 group max-sm:w-32">
                <div className="aspect-2/3 overflow-hidden rounded-md border relative">
                    <img
                        alt={item.mediaName}
                        src={item.mediaCover}
                        className="w-full h-full object-cover transition-transform"
                    />
                    <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors"/>
                </div>
                <p className="text-xs font-medium text-muted-foreground truncate group-hover:text-white">
                    {item.mediaName}
                </p>
            </div>
        </Link>
    );
}
