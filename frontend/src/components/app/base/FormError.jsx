import {useState} from "react";
import {LuX} from "react-icons/lu";
import {cn} from "@/utils/functions";
import {ExclamationTriangleIcon} from "@radix-ui/react-icons";


export const FormError = ({ message, className }) => {
    const [isVisible, setIsVisible] = useState(true);

    const handleDismiss = () => {
        setIsVisible(false);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn("bg-rose-500/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-neutral-200", className)}>
            <ExclamationTriangleIcon className="h-4 w-4"/>
            <p>{message}</p>
            <div role="button" onClick={handleDismiss} className="ml-auto">
                <LuX className="h-4 w-4"/>
            </div>
        </div>
    );
};
