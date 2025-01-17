import {useState} from "react";
import {cn} from "@/utils/functions";
import {LoaderCircle} from "lucide-react";
import {Button} from "@/components/ui/button";


export const FormButton = ({ children, disabled = false, onClick, className, ...props }) => {
    const [isPending, setIsPending] = useState(false);

    const handleClick = async (ev) => {
        if (onClick) {
            setIsPending(true);
            ev.preventDefault();
            try {
                await onClick();
            }
            finally {
                setIsPending(false);
            }
        }
    };

    return (
        <Button
            type="submit"
            onClick={handleClick}
            disabled={disabled || isPending}
            className={cn(className ? className : "w-full", className)}
            {...props}
        >
            {isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin"/>}
            {children}
        </Button>
    );
};
