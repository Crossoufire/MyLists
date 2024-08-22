import {cn} from "@/lib/utils";


export const MutedText = ({ text, className }) => {
    return (
        <div className={cn("text-muted-foreground italic", className)}>
            {text}
        </div>
    );
};
