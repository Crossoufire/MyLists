import {cn} from "@/utils/functions";
import {Separator} from "@/components/ui/separator";


export const MediaTitle = ({ children, className, ...props }) => {
    return (
        <>
            <h4 className={cn("text-xl font-semibold", className)}>{children}</h4>
            <Separator variant="large" {...props}/>
        </>
    );
};
