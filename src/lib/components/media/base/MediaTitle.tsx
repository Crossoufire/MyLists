import React from "react";
import {cn} from "@/lib/utils/helpers";
import {Separator} from "@/lib/components/ui/separator";


interface MediaTitleProps {
    className?: string;
    children: React.ReactNode;
}


export const MediaTitle = ({ children, className }: MediaTitleProps) => {
    return (
        <h4 className={cn("text-xl font-semibold mb-2", className)}>
            {children}
            <Separator className="mt-0.5"/>
        </h4>
    );
};
