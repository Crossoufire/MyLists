import * as React from "react"
import * as TooltipPrimitive from "@radix-ui/react-tooltip"
import {cn} from "@/lib/utils.jsx"


const TooltipProvider = TooltipPrimitive.Provider;

const TooltipPrim = TooltipPrimitive.Root;

const TooltipTrigger = TooltipPrimitive.Trigger;

const TooltipArrow = TooltipPrimitive.Arrow;


const TooltipContent = React.forwardRef(({ className, sideOffset = 4, ...props }, ref) => (
    <TooltipPrimitive.Content
        ref={ref}
        sideOffset={sideOffset}
        className={cn("z-50 overflow-hidden rounded-md bg-primary px-3 py-1.5 text-xs text-primary-foreground " +
            "animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 d" +
            "ata-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 " +
            "data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2", className)}
        {...props}
    />
))
TooltipContent.displayName = TooltipPrimitive.Content.displayName;


const Tooltip = React.forwardRef(({ children, text, side, className, offset = 10, ...props }, ref) => {
    return (
        <TooltipProvider delayDuration={props.delay || 50}>
            <TooltipPrim>
                <TooltipTrigger asChild>
                    {children}
                </TooltipTrigger>
                <TooltipContent ref={ref} sideOffset={offset} side={side} {...props} className={cn("text-sm " +
                "text-primary bg-primary-foreground", className)}>
                    <TooltipArrow className="fill-primary-foreground"/>
                    <p>{text}</p>
                </TooltipContent>
            </TooltipPrim>
        </TooltipProvider>
    );
});


export { Tooltip };
