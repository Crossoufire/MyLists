import React from "react";
import {cn} from "@/lib/utils/helpers";


interface MutedTextProps {
    className?: string;
    children: React.ReactNode;
}


export const MutedText = ({ children, className }: MutedTextProps) => {
    return (
        <div className={cn("text-muted-foreground italic", className)}>
            {children}
        </div>
    );
};
