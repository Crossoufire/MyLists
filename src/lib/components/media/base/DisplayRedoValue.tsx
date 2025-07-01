import {RotateCw} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowsByType, ExtractListByType} from "@/lib/components/types";


interface DisplayRedoValueProps {
    userData: ExtractFollowsByType<typeof MediaType.MOVIES | typeof MediaType.BOOKS | typeof MediaType.MANGA>
        | ExtractListByType<typeof MediaType.MOVIES | typeof MediaType.BOOKS | typeof MediaType.MANGA>;
}


export const DisplayRedoValue = ({ userData }: DisplayRedoValueProps) => {
    return (
        <div className="flex items-center gap-x-2">
            <RotateCw size={15} className="text-green-500"/>
            <div>{userData.userMedia.redo}</div>
        </div>
    );
};