import {cn} from "@/utils/functions";
import {LuLoader2} from "react-icons/lu";
import {Button} from "@/components/ui/button";
import {ButtonHTMLAttributes, ReactNode, useState} from "react";


interface FormButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode;
    className?: string;
    disabled?: boolean;
    onClick?: (() => Promise<void> | void) | undefined;
}


export const FormButton = ({children, disabled = false, onClick, className, ...props}: FormButtonProps) => {
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

    // @ts-ignore
    return (
        <Button
            type="submit"
            onClick={handleClick}
            disabled={disabled || isPending}
            className={cn(className ? className : "w-full", className)}
            {...props}
        >
            {isPending && <LuLoader2 className="mr-2 h-4 w-4 animate-spin"/>}
            {children}
        </Button>
    );
};
