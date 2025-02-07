import {cn, getMediaColor} from "@/utils/functions";


export const MediaLevelCircle = ({ intLevel, mediaType, containerClassName, className, isActive = true }) => {
    if (intLevel === null || intLevel === undefined) {
        intLevel = 0;
    }

    return (
        <div className={cn("mx-auto flex items-center justify-center", containerClassName)}>
            <div className={cn("font-bold text-xl", className)} style={{ color: isActive ? getMediaColor(mediaType) : "grey" }}>
                {intLevel}
            </div>
        </div>
    );
};