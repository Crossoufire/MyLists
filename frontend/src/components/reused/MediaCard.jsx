import {cn} from "@/lib/utils";
import {Link} from "react-router-dom";
import {Card} from "@/components/ui/card";
import {Tooltip} from "@/components/ui/tooltip";
import {LoadingIcon} from "@/components/primitives/LoadingIcon";


export const MediaCard = ({ children, media, mediaType, botRounded, isLoading = false }) => {
    const mediaName = media.name || media.media_name;
    const mediaId = media.media_id ? media.media_id : media.id;

    return (
        <Card>
            <div className="relative">
                <Link to={`/details/${mediaType}/${mediaId}`}>
                    <Tooltip text={mediaName} delay={800}>
                        <img
                            src={media.media_cover}
                            style={{height: "auto"}}
                            className={cn("h-[300px] w-full border border-black rounded-tl-sm rounded-tr-sm", botRounded &&
                                "rounded-bl-sm rounded-br-sm")}
                            alt={mediaName}
                        />
                    </Tooltip>
                </Link>
                {/*<Link to={`/details/${mediaType}/${media.id || media.media_id}`} className={cn("z-10 absolute flex-col " +*/}
                {/*"items-center group-hover:opacity-100 top-0 h-full w-full opacity-0 transition duration-300 " +*/}
                {/*"justify-center rounded-tl-sm rounded-tr-sm bg-black/80 flex", botRounded && "rounded-bl-sm rounded-br-sm")}>*/}
                {/*    <span className="text-2xl px-2 text-center">{media.name || media.media_name}</span>*/}
                {/*</Link>*/}
                {isLoading &&
                    <div className={cn("absolute h-full w-full top-[50%] left-[50%] transform -translate-x-1/2 flex " +
                        "-translate-y-1/2 bg-black opacity-95 p-5 rounded-tl-sm rounded-tr-sm justify-center " +
                        "items-center", botRounded && "rounded-bl-sm rounded-br-sm")}>
                        <LoadingIcon size={15}/>
                    </div>
                }
                {children}
            </div>
        </Card>
    );
};
