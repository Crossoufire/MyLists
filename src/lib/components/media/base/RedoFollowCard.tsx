import {RotateCw} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowsByType} from "@/lib/components/types";


interface RedoFollowCardProps {
    follow: ExtractFollowsByType<typeof MediaType.MOVIES | typeof MediaType.BOOKS | typeof MediaType.MANGA>;
}


export const RedoFollowCard = ({ follow }: RedoFollowCardProps) => {
    return (
        <div className="flex items-center gap-x-2">
            <RotateCw size={15} className="text-green-500"/>
            <div>{follow.userMedia.redo}</div>
        </div>
    );
};