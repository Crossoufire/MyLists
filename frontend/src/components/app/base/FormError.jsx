import {cn} from "@/lib/utils";
import {ExclamationTriangleIcon} from "@radix-ui/react-icons";


export const FormError = ({ message, className }) => {
    if (!message) return null;

    return (
        <div className={cn("bg-rose-500/10 p-3 rounded-md flex items-center gap-x-2 text-sm text-neutral-200", className)}>
            <ExclamationTriangleIcon className="h-4 w-4"/>
            <p>{message}</p>
        </div>
    );
};