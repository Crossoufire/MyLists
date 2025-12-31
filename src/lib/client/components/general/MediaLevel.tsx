import {Ban} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {MediaType} from "@/lib/utils/enums";
import {getMediaColor} from "@/lib/utils/functions";


interface MediaLevelProps {
    intLevel?: number;
    className?: string;
    isActive?: boolean;
    mediaType: MediaType;
    containerClassName?: string;
}


export const MediaLevel = ({ intLevel = 0, mediaType, containerClassName, className, isActive = true }: MediaLevelProps) => {
    const color = isActive ? getMediaColor(mediaType) : "grey";

    return (
        <div className={cn("mx-auto flex items-center justify-center", containerClassName)}>
            <div className={cn("font-bold text-xl", className)} style={{ color: color }}>
                {isActive ? intLevel : <Ban className="w-4 h-4 mt-2 mb-1"/>}
            </div>
        </div>
    );
};
