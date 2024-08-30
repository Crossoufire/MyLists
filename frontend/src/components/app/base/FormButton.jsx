import {cn} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {LuLoader2} from "react-icons/lu";


export const FormButton = ({ children, size = 8, className, pending, ...props }) => {
    return (
        <Button type="submit" className={cn(className ? className : "w-full", className)} disabled={pending} {...props}>
            {pending ? <><LuLoader2 className="mr-2 h-4 w-4 animate-spin"/> {children}</> : children}
        </Button>
    );
};
