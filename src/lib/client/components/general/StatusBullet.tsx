import {cn} from "@/lib/utils/helpers";
import {Status} from "@/lib/utils/enums";
import {getStatusColor} from "@/lib/utils/functions";


interface StatusBulletProps {
    status: Status;
    className?: string;
}


export const StatusBullet = ({ status, className }: StatusBulletProps) => {
    return (
        <div
            className={cn(`inline-block mr-[8px] w-[10px] h-[10px] rounded-full`, className)}
            style={{ backgroundColor: getStatusColor(status) }}
        />
    );
};
