import {cn} from "@/lib/utils";
import {Link} from "react-router-dom";
import {Card} from "@/components/ui/card";
import {Tooltip} from "@/components/ui/tooltip";
import {LoadingIcon} from "@/components/app/base/LoadingIcon";


export const MediaCard = ({ children, media, mediaType, botRounded, isLoading = false }) => {
    return (
        <Card>
            <div className="relative">
                <Link to={`/details/${mediaType}/${media.media_id}`}>
                    <Tooltip text={media.media_name} delay={800}>
                        <img
                            src={media.media_cover}
                            className={cn("w-full border border-black rounded-tl-sm rounded-tr-sm",
                            botRounded && "rounded-bl-sm rounded-br-sm")}
                            alt={media.media_name}
                        />
                    </Tooltip>
                </Link>
                {isLoading &&
                    <div className={cn("absolute h-full w-full top-[50%] left-[50%] transform -translate-x-1/2 " +
                        "-translate-y-1/2 flex justify-center items-center rounded-tl-sm rounded-tr-sm bg-black " +
                        "opacity-95", botRounded && "rounded-bl-sm rounded-br-sm")}>
                        <LoadingIcon size={10}/>
                    </div>
                }
                {children}
            </div>
        </Card>
    );
};
