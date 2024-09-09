import {cn} from "@/utils/functions.jsx";


export const MutedText = ({ children, className }) => {
    return <div className={cn("text-muted-foreground italic", className)}>{children}</div>;
};
