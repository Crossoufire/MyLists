import {Ban} from "lucide-react";
import {cn} from "@/lib/utils/helpers";
import {MediaType} from "@/lib/utils/enums";
import {getMediaColor} from "@/lib/utils/functions";
import {computeLevel} from "@/lib/utils/compute-level";


interface MediaLevelProps {
    timeSpent: number;
    className?: string;
    isActive?: boolean;
    mediaType: MediaType;
    containerClassName?: string;
}


export const MediaLevel = ({ timeSpent, mediaType, containerClassName, className, isActive = true }: MediaLevelProps) => {
    const color = isActive ? getMediaColor(mediaType) : "grey";
    const intLevel = Math.floor(Math.floor(computeLevel(timeSpent)));

    return (
        <div className={cn("mx-auto flex items-center justify-center", containerClassName)}>
            <div className={cn("font-bold text-xl", className)} style={{ color: color }}>
                {isActive ?
                    intLevel
                    :
                    <Ban className="size-4 mt-2 mb-1"/>
                }
            </div>
        </div>
    );
};
