import {cn} from "@/lib/utils";


export const BulletIcon = ({ color, className }) => {
    return (
        <div
            className={cn("inline-block mr-[8px] w-[10px] h-[10px] rounded-full", className)}
            style={{ backgroundColor: color }}
        />
    );
};
