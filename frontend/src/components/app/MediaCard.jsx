import {Card} from "@/components/ui/card";
import {LoaderCircle} from "lucide-react";
import {BlockLink} from "@/components/app/BlockLink";


export const MediaCard = ({ children, media, mediaType, isPending = false }) => {
    return (
        <Card className="rounded-lg">
            <div className="relative aspect-[2/3] rounded-lg border border-black">
                <BlockLink to={`/details/${mediaType}/${media.media_id}`}>
                    <img
                        alt={media.media_name}
                        src={media.media_cover}
                        className="object-cover w-full h-full rounded-lg"
                    />
                </BlockLink>
                {isPending &&
                    <div className="z-50 absolute h-full w-full top-[50%] left-[50%] transform -translate-x-1/2
                    -translate-y-1/2 flex justify-center items-center bg-black opacity-80 rounded-md">
                        <LoaderCircle className="h-6 w-6 animate-spin"/>
                    </div>
                }
                {children}
            </div>
        </Card>
    );
};
