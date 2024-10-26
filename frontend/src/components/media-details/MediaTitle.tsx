import {ReactNode} from "react";
import {cn} from "@/utils/functions";
import {Separator} from "@/components/ui/separator";


export const MediaTitle = ({children, className, ...props}: MediaTitleProps) => {
    return (
        <>
            <h4 className={cn("text-xl font-semibold", className)}>{children}</h4>
            <Separator variant="large" {...props}/>
        </>
    );
};


interface MediaTitleProps {
    children: ReactNode;
    className?: string;
}