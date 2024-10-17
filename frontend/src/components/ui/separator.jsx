import {forwardRef} from "react";
import {cn} from "@/utils/functions";
import {cva} from "class-variance-authority";
import * as SeparatorPrimitive from "@radix-ui/react-separator";


const separatorVariants = cva("shrink-0 bg-border w-full",
    {
        variants: {
            variant: {
                default: "h-[1px] mt-2 mb-2",
                large: "h-[2px] mt-0 mb-2",
                vertical: "w-[2px] h-[75%]",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);


const Separator = forwardRef(({ className, variant, orientation = "horizontal", ...props }, ref) => (
    <SeparatorPrimitive.Root
        ref={ref}
        decorative
        orientation={orientation}
        className={cn(separatorVariants({ variant, className }))}
        {...props}
    />
));
Separator.displayName = SeparatorPrimitive.Root.displayName;


export {Separator};
