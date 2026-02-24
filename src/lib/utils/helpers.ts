import {twMerge} from "tailwind-merge";
import {type ClassValue, clsx} from "clsx";


export const mail = "contact.us.at.mylists@gmail.com";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}


export const getZodMutationError = (error: any) => {
    if (!error) return null;

    if (error.issues && Array.isArray(error.issues) && error.issues.length > 0) {
        return error.issues[0].message;
    }

    return error.message || "An unexpected error occurred";
};
