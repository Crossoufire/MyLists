import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";


export const FormButton = ({ children, size = 8, className, pending, ...props }) => {
    return (
        <Button type="submit" className={cn(className ? className : "w-full", className)} disabled={pending} {...props}>
            {children}
        </Button>
    );
};
