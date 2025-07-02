import {MediaType} from "@/lib/server/utils/enums";
import {formatRating} from "@/lib/utils/functions";
import {mediaConfig} from "@/lib/components/media-config";
import {ExtractFollowByType} from "@/lib/components/types";


interface MediaFollowCard<T extends MediaType> {
    mediaType: T;
    followData: ExtractFollowByType<T>;
}


export const MediaFollowCard = <T extends MediaType>({ followData, mediaType }: MediaFollowCard<T>) => {
    const FollowCardComponent = mediaConfig[mediaType].mediaFollowCard;
    const rating = formatRating(followData.ratingSystem, followData.userMedia.rating);

    return (
        <FollowCardComponent
            rating={rating}
            followData={followData}
        />
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
