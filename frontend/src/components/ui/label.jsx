import * as React from "react";
import {cn} from "@/utils/functions.jsx";
import {cva} from "class-variance-authority";
import * as LabelPrimitive from "@radix-ui/react-label";


const labelVariants = cva("text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70");


const Label = React.forwardRef(({ className, ...props }, ref) => (
    <LabelPrimitive.Root
        ref={ref}
        className={cn(labelVariants(), className)}
        {...props}
    />
));
Label.displayName = LabelPrimitive.Root.displayName;


export {Label};
