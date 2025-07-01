import {MessageCircle} from "lucide-react";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {FollowData} from "@/lib/components/types";
import {MediaType} from "@/lib/server/utils/enums";
import {Separator} from "@/lib/components/ui/separator";
import {mediaConfig} from "@/lib/components/media-config";
import {Card, CardContent} from "@/lib/components/ui/card";
import {DisplayRating} from "@/lib/components/media/DisplayRating";
import {formatRating, getStatusColor} from "@/lib/utils/functions";
import {DisplayComment} from "@/lib/components/media/DisplayComment";
import {DisplayFavorite} from "@/lib/components/media/DisplayFavorite";


interface FollowCardProps {
    follow: FollowData;
    mediaType: MediaType;
}


export const FollowCard = ({ follow, mediaType }: FollowCardProps) => {
    const rating = formatRating(follow.ratingSystem, follow.userMedia.rating);
    const [RedoComponent, DetailsComponent] = mediaConfig[mediaType].mediaFollowCards;

    const getTextColor = (backColor: string) => {
        const hex = backColor.replace("#", "");
        const r = parseInt(hex.substring(0, 2), 16);
        const g = parseInt(hex.substring(2, 2 + 2), 16);
        const b = parseInt(hex.substring(4, 4 + 2), 16);
        return (0.299 * r + 0.587 * g + 0.114 * b) > 128 ? "#000000" : "#e2e2e2";
    };

    return (
        <Card className="h-full">
            <CardContent className="p-4">
                <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-3">
                        <Link to="/profile/$username" params={{ username: follow.name }}>
                            <img
                                alt={follow.name}
                                src={follow.image}
                                className="bg-neutral-600 h-[52px] w-[52px] rounded-full"
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-1">
                        <Link to="/profile/$username" params={{ username: follow.name }}>
                            <div className="text-lg font-medium">{follow.name}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <DisplayRating rating={rating}/>

                            {RedoComponent ? <RedoComponent userData={follow as any}/> : null}

                            <div className="flex items-center gap-x-2">
                                {follow.userMedia.comment ?
                                    <DisplayComment content={follow.userMedia.comment}/> : <MessageCircle size={15}/>
                                }
                            </div>
                            <DisplayFavorite isFavorite={!!follow.userMedia.favorite}/>
                        </div>
                    </div>
                </div>
                <Separator className="mb-3 mt-3"/>
                <div className="flex items-center justify-between">
                    <Badge style={{ background: getStatusColor(follow.userMedia.status), color: getTextColor(getStatusColor(follow.userMedia.status)) }}>
                        {follow.userMedia.status}
                    </Badge>

                    {DetailsComponent ? <DetailsComponent userData={follow as any}/> : null}

                </div>
            </CardContent>
        </Card>
    );
};


// const MoreFollowDetails = ({ mediaType, follow }: MoreFollowDetailsProps) => {
//     else if (mediaType === MediaType.BOOKS && follow.userMedia.status !== Status.PLAN_TO_READ) {
//         return (
//             <div className="flex gap-x-2 items-center">
//                 <Play size={16} className="mt-0.5"/> Pages {follow.userMedia.actualPage}/{follow.userMedia.totalPages}
//             </div>
//         );
//     }
//     else if (mediaType === MediaType.MANGA && follow.userMedia.status !== Status.PLAN_TO_READ) {
//         return (
//             <div className="flex gap-x-2 items-center">
//                 <Play size={16} className="mt-0.5"/> Chpt. {follow.userMedia.currentChapter}/{follow.userMedia.totalChapters ?? "?"}
//             </div>
//         );
//     }
// };
