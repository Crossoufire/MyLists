import {cn} from "@/lib/utils";
import {Separator} from "@/components/ui/separator";


export const MediaTitle = ({ children, className, ...props }) => {
    return (
        <>
            <h4 className={cn("text-2xl font-semibold", className)}>{children}</h4>
            <Separator variant="large" {...props}/>
        </>
    );
};
