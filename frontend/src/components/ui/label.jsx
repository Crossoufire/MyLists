import * as React from "react";
import {cn} from "@/utils/functions";
import {cva} from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";


const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");


const Label = (
    {
        ref,
        className,
        ...props
    }
) => (<LabelPrimitive.Root
    ref={ref}
    className={cn(labelVariants(), className)}
    {...props}
/>);
Label.displayName = LabelPrimitive.Root.displayName;


export {Label};
