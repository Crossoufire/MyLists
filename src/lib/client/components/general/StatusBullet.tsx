import {cn} from "@/lib/utils/helpers";
import {Status} from "@/lib/utils/enums";
import {getThemeColor} from "@/lib/utils/colors-and-icons";


interface StatusBulletProps {
    status: Status;
    className?: string;
}


export const StatusBullet = ({ status, className }: StatusBulletProps) => {
    return (
        <div
            style={{ backgroundColor: getThemeColor(status) }}
            className={cn(`inline-block mr-2 size-2.5 rounded-full`, className)}
        />
    );
};
