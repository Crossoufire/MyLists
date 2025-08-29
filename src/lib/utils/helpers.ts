import {twMerge} from "tailwind-merge";
import {type ClassValue, clsx} from "clsx";


export const mail = "contact.us.at.mylists@gmail.com";


export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}
