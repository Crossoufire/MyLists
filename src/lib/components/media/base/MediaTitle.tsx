import React from "react";
import {cn} from "@/lib/utils/helpers";
import {Separator} from "@/lib/components/ui/separator";


interface MediaTitleProps {
    className?: string;
    children: React.ReactNode;
}


export const MediaTitle = ({ children, className, ...props }: MediaTitleProps) => {
    return (
        <>
            <h4 className={cn("text-xl font-semibold", className)}>{children}</h4>
            <Separator {...props}/>
        </>
    );
};
