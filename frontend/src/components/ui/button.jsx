import * as React from "react";
import {cn} from "@/utils/functions";
import {Slot} from "@radix-ui/react-slot";
import {cva} from "class-variance-authority";


const buttonVariants = cva("inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium " +
    "transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none " +
    "disabled:opacity-50",
    {
        variants: {
            variant: {
                default: "bg-primary text-primary-foreground shadow hover:bg-primary/90",
                destructive: "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/80",
                outline: "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
                secondary: "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
                colored: "bg-amber-800 text-primary-foreground shadow-sm hover:bg-amber-800/80",
                warning: "bg-amber-800 text-secondary-foreground shadow-sm hover:bg-amber-800/80",
                ghost: "hover:bg-accent hover:text-accent-foreground",
                link: "text-primary underline-offset-4 hover:underline",
                invisible: "",
                list: "flex justify-start items-center w-full rounded-md font-normal hover:bg-accent " +
                    "hover:text-accent-foreground",
                filters: "flex items-center gap-2 border-gray-700 hover:bg-gray-800 border border-input " +
                    "shadow-sm hover:bg-accent hover:text-accent-foreground"
            },
            size: {
                default: "h-9 px-4 py-2",
                xs: "h-7 rounded-md px-2 text-xs",
                sm: "h-8 rounded-md px-3 text-xs",
                lg: "h-10 rounded-md px-8",
                icon: "h-9 w-7",
            },
        },
        defaultVariants: {
            variant: "default",
            size: "default",
        },
    }
);


const Button = React.forwardRef(({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
        <Comp
            className={cn(buttonVariants({ variant, size, className }))}
            ref={ref}
            {...props}
        />
    );
});
Button.displayName = "Button";


export { Button, buttonVariants };
