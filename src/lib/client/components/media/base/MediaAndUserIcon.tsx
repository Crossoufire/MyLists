import {MediaType} from "@/lib/utils/enums";
import {getMediaColor, getMediaIcon} from "@/lib/utils/functions";


interface MediaIconProps {
    size?: number;
    className?: string;
    type: MediaType | "user";
}


export const MediaAndUserIcon = ({ type, size, className }: MediaIconProps) => {
    const IconComp = getMediaIcon(type);
    if (!IconComp) return null;

    return (
        <IconComp
            size={size ?? 18}
            className={className}
            style={{ color: getMediaColor(type) }}
        />
    );
};
