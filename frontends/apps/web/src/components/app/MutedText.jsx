import {cn} from "@/utils/functions";


export const MutedText = ({ children, className }) => {
    return <div className={cn("text-muted-foreground italic", className)}>{children}</div>;
};
