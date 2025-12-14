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
            className={cn(`inline-block mr-2 w-2.5 h-2.5 rounded-full`, className)}
            style={{ backgroundColor: getStatusColor(status) }}
        />
    );
};
