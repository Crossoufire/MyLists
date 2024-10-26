import React from "react";
import {cn, getLevelColor} from "@/utils/functions";


interface MediaLevelCircleProps {
    intLevel?: number | null;
    className?: string;
    isActive?: boolean;
}


export const MediaLevelCircle = ({intLevel, className, isActive = true}: MediaLevelCircleProps) => {
    if (intLevel === null || intLevel === undefined) {
        intLevel = 0;
    }

    return (
        <div className={cn("mt-0.5 relative w-[35px] h-[35px] rounded-full flex items-center justify-center " +
            "border-2", className)} style={{borderColor: isActive ? getLevelColor(intLevel) : "grey"}}>
            <span className="font-medium" style={{fontSize: `${Math.max(21 - intLevel.toString().length * 2, 12)}px`}}>
                {intLevel}
            </span>
        </div>
    );
};