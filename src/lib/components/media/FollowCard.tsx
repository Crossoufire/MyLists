import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {Badge} from "@/lib/components/ui/badge";
import {Separator} from "@/lib/components/ui/separator";
import {Heart, MessageCircle, Star} from "lucide-react";
import {Card, CardContent} from "@/lib/components/ui/card";
import {getFeelingIcon, getStatusColor} from "@/lib/utils/functions";
import {RedoFollowCard} from "@/lib/components/media/base/RedoFollowCard";
import {TvRedoFollowCard} from "@/lib/components/media/tv/TvRedoFollowCard";
import {MediaType, RatingSystemType, Status} from "@/lib/server/utils/enums";
import {mediaDetailsOptions} from "@/lib/react-query/query-options/query-options";
import {TvDetailsFollowCard} from "@/lib/components/media/tv/TvDetailsFollowCard";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {GamesDetailsFollowCard} from "@/lib/components/media/games/GamesDetailsFollowCard";


export type FollowsData = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["followsData"]


interface FollowCardProps {
    mediaType: MediaType;
    follow: FollowsData[0];
}


export const FollowCard = ({ follow, mediaType }: FollowCardProps) => {
    const rating = formatRating();

    function formatRating() {
        if (follow.ratingSystem === RatingSystemType.FEELING) {
            return getFeelingIcon(follow.userMedia.rating, { size: 17 });
        }
        return follow.userMedia.rating === null ? "--" : follow.userMedia.rating.toFixed(1);
    }

    const renderDetails = () => {
        if (mediaType === MediaType.ANIME || mediaType === MediaType.SERIES) {
            return [
                <TvRedoFollowCard follow={follow as Extract<FollowsData[0], { userMedia: { redo2: number[] } }>}/>,
                <TvDetailsFollowCard follow={follow as Extract<FollowsData[0], { userMedia: { currentSeason: number } }>}/>
            ];
        }
        else if (mediaType === MediaType.GAMES) {
            return [
                null,
                <GamesDetailsFollowCard follow={follow as Extract<FollowsData[0], { userMedia: { playtime: number | null } }>}/>,
            ];
        }
        else if (mediaType === MediaType.MOVIES) {
            return [
                <RedoFollowCard follow={follow as Extract<FollowsData[0], { userMedia: { redo: number | null } }>}/>,
                null,
            ];
        }
        else {
            return [null, null];
        }
    };

    return (
        <FollowCardLayout
            rating={rating}
            image={follow.image}
            username={follow.name}
            childrens={renderDetails()}
            status={follow.userMedia.status}
            comment={follow.userMedia.comment}
            isFavorite={follow.userMedia.favorite}
        />
    );
};


interface FollowCardLayoutProps {
    image: string;
    status: Status;
    username: string;
    comment: string | null;
    rating: React.ReactNode;
    isFavorite: boolean | null;
    childrens: React.ReactNode[];
}


const FollowCardLayout = ({ username, image, status, rating, comment, isFavorite, childrens }: FollowCardLayoutProps) => {

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
                        <Link to="/profile/$username" params={{ username }}>
                            <img
                                src={image}
                                alt={username}
                                className="bg-neutral-600 h-[52px] w-[52px] rounded-full"
                            />
                        </Link>
                    </div>
                    <div className="col-span-9 space-y-1">
                        <Link to="/profile/$username" params={{ username }}>
                            <div className="text-lg font-medium">{username}</div>
                        </Link>
                        <div className="flex justify-between items-center pr-3">
                            <div className="flex items-center gap-x-2">
                                <Star size={15} className={cn("text-gray-400", rating !== "--" && "text-amber-500")}/>
                                <div>{rating}</div>
                            </div>
                            {childrens[0]}
                            <div className="flex items-center gap-x-2">
                                {comment ?
                                    <Popover>
                                        <PopoverTrigger>
                                            <MessageCircle size={15} className="text-blue-500"/>
                                        </PopoverTrigger>
                                        <PopoverContent>{comment}</PopoverContent>
                                    </Popover>
                                    :
                                    <MessageCircle size={15}/>
                                }
                            </div>
                            <Heart
                                size={15}
                                className={cn("", isFavorite && "text-red-700")}
                            />
                        </div>
                    </div>
                </div>
                <Separator className="mb-3 mt-3"/>
                <div className="flex items-center justify-between">
                    <Badge style={{ background: getStatusColor(status), color: getTextColor(getStatusColor(status)) }}>
                        {status}
                    </Badge>
                    {childrens[1]}
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
