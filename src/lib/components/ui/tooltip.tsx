import * as React from "react"
import {cn} from "@/lib/utils/helpers"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"


const TooltipArrow = TooltipPrimitive.Arrow;


function TooltipProvider({ delayDuration = 0, ...props }: React.ComponentProps<typeof TooltipPrimitive.Provider>) {
    return (
        <TooltipPrimitive.Provider
            data-slot="tooltip-provider"
            delayDuration={delayDuration}
            {...props}
        />
    )
}


function TooltipPrim({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Root>) {
    return (
        <TooltipProvider>
            <TooltipPrimitive.Root data-slot="tooltip" {...props}/>
        </TooltipProvider>
    )
}


function TooltipTrigger({ ...props }: React.ComponentProps<typeof TooltipPrimitive.Trigger>) {
    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props}/>
}


function TooltipContent({ className, sideOffset = 0, children, ...props }: React.ComponentProps<typeof TooltipPrimitive.Content>) {
    return (
        <TooltipPrimitive.Portal>
            <TooltipPrimitive.Content
                data-slot="tooltip-content"
                sideOffset={sideOffset}
                className={cn("bg-primary text-primary-foreground animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out " +
                    "data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 " +
                    "data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 " +
                    "z-50 w-fit origin-(--radix-tooltip-content-transform-origin) rounded-md px-3 py-1.5 text-xs text-balance",
                    className
                )}
                {...props}
            >
                {children}
                <TooltipPrimitive.Arrow className="bg-primary fill-primary z-50 size-2.5 translate-y-[calc(-50%_-_2px)] rotate-45 rounded-[2px]"/>
            </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
    )
}


interface TooltipProps {
    text?: string;
    delay?: number;
    offset?: number;
    subText?: string;
    className?: string;
    children: React.ReactNode;
    side?: "top" | "right" | "bottom" | "left";
}


const Tooltip = ({ children, text, subText, side, className, offset = 10, ...props }: TooltipProps) => {
    return (
        <TooltipProvider delayDuration={props.delay || 50}>
            <TooltipPrim>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent sideOffset={offset} side={side} {...props} className={cn("text-sm " +
                    "text-primary bg-primary-foreground", className)}>
                    <TooltipArrow className="fill-primary-foreground"/>
                    <p>{text}</p>
                    <p>{subText}</p>
                </TooltipContent>
            </TooltipPrim>
        </TooltipProvider>
    );
};


export {Tooltip, TooltipContent, TooltipPrim, TooltipProvider, TooltipTrigger}
