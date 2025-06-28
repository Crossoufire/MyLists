import {RotateCw} from "lucide-react";
import {FollowsData} from "@/lib/components/media/FollowCard";


interface RedoFollowCardProps {
    follow: Extract<FollowsData[0], { userMedia: { redo: number | null } }>;
}


export const RedoFollowCard = ({ follow }: RedoFollowCardProps) => {
    return (
        <div className="flex items-center gap-x-2">
            <RotateCw size={15} className="text-green-500"/>
            <div>{follow.userMedia.redo}</div>
        </div>
    );
};