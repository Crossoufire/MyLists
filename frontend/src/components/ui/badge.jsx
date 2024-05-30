import * as React from "react";
import {cn} from "@/lib/utils";
import {cva} from "class-variance-authority";


const badgeVariants = cva("inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold " +
    "transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
    {
        variants: {
            variant: {
                outline: "text-foreground",
                default: "border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/80",
                secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
                destructive: "border-transparent bg-destructive text-destructive-foreground shadow hover:bg-destructive/80",
                passive: "border-transparent bg-secondary text-secondary-foreground",
                passiveSmall: "border-transparent bg-secondary text-secondary-foreground px-2 py-[1px]",
                notif: "border-transparent bg-secondary text-secondary-foreground px-1.5 py-[1px] rounded-full",
                label: "cursor-pointer border-transparent bg-green-700 text-secondary-foreground hover:bg-green-700/80 px-2.5 py-1 text-sm",
                labelToAdd: "cursor-pointer border-transparent bg-cyan-700 text-secondary-foreground hover:bg-cyan-700/80 px-2.5 py-1 text-sm",
            },
        },
        defaultVariants: {
            variant: "default",
        },
    }
);


function Badge({ className, variant, ...props}) {
    return (
        <div
            className={cn(badgeVariants({ variant }), className)}
            {...props}
        />
    );
}

export { Badge, badgeVariants }
