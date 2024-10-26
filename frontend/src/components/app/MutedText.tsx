import React from "react";
import {cn} from "@/utils/functions";


interface MutedTextProps {
    children: React.ReactNode;
    className?: string;
}


export const MutedText = ({children, className}: MutedTextProps) => {
    return <div className={cn("text-muted-foreground italic", className)}>{children}</div>;
};
