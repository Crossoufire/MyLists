import {cn, getStatusColor} from "@/utils/functions";


export const StatusBullet = ({ status, className }) => {
    return (
        <div
            className={cn(`inline-block mr-[8px] w-[10px] h-[10px] rounded-full`, className)}
            style={{ backgroundColor: getStatusColor(status) }}
        />
    );
};
