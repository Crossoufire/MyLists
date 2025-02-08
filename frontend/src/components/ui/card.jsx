import * as React from "react";
import {cn} from "@/utils/functions";


const Card = (
    {
        ref,
        className,
        ...props
    }
) => (<div
    ref={ref}
    className={cn("rounded-md bg-card text-card-foreground shadow", className)}
    {...props}
/>);
Card.displayName = "Card";


const CardHeader = (
    {
        ref,
        className,
        ...props
    }
) => (<div
    ref={ref}
    className={cn("flex flex-col space-y-1.5 p-2 px-3 py-2 text-lg font-bold", className)}
    {...props}
/>);
CardHeader.displayName = "CardHeader";


const CardTitle = (
    {
        ref,
        className,
        ...props
    }
) => (<h3
    ref={ref}
    className={cn("font-semibold text-xl flex items-center justify-between", className)}
    {...props}
/>);
CardTitle.displayName = "CardTitle";


const CardDescription = (
    {
        ref,
        className,
        ...props
    }
) => (<p
    ref={ref}
    className={cn("text-sm text-muted-foreground font-normal", className)}
    {...props}
/>);
CardDescription.displayName = "CardDescription";


const CardContent = (
    {
        ref,
        className,
        ...props
    }
) => (<div
    ref={ref}
    className={cn("p-4 pt-0", className)}
    {...props}
/>);
CardContent.displayName = "CardContent";


const CardFooter = (
    {
        ref,
        className,
        ...props
    }
) => (<div
    ref={ref}
    className={cn("flex items-center p-4 pt-0", className)}
    {...props}
/>);
CardFooter.displayName = "CardFooter";


export {Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent};
