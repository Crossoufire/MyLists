import * as React from "react";
import {cn} from "@/utils/functions";
import * as ProgressPrimitive from "@radix-ui/react-progress";


const Progress = (
    {
        ref,
        className,
        color,
        value,
        ...props
    }
) => (<ProgressPrimitive.Root ref={ref} className={cn("relative h-2.5 w-full overflow-hidden rounded-full bg-primary/20", className)} {...props}>
    <ProgressPrimitive.Indicator
        className={cn("h-full w-full flex-1 transition-all", !color && "bg-primary")}
        style={{ transform: `translateX(-${100 - (value || 0)}%)`, backgroundColor: color }}
    />
</ProgressPrimitive.Root>);
Progress.displayName = ProgressPrimitive.Root.displayName;


export {Progress};
