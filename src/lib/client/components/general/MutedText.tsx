import React from "react";
import {cn} from "@/lib/utils/helpers";


interface MutedTextProps {
    italic?: boolean;
    className?: string;
    children: React.ReactNode;
}


export const MutedText = ({ children, className, italic = true }: MutedTextProps) => {
    return (
        <div className={cn("text-muted-foreground", className, italic && "italic")}>
            {children}
        </div>
    );
};
