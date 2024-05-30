import {Card} from "@/components/ui/card";
import {Link} from "@tanstack/react-router";
import {LoadingIcon} from "@/components/app/base/LoadingIcon";


export const MediaCard = ({ children, media, mediaType, isLoading = false }) => {
    return (
        <Card className="border border-black rounded-lg">
            <div className="relative">
                <Link to={`/details/${mediaType}/${media.media_id}`}>
                    <img
                        src={media.media_cover}
                        className="w-full rounded-lg"
                        alt={media.media_name}
                    />
                </Link>
                {isLoading &&
                    <div className="absolute h-full w-full top-[50%] left-[50%] transform -translate-x-1/2
                        -translate-y-1/2 flex justify-center items-center bg-black opacity-95">
                        <LoadingIcon size={10}/>
                    </div>
                }
                {children}
            </div>
        </Card>
    );
};