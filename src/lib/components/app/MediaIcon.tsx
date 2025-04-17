import {MediaType} from "@/lib/server/utils/enums";
import {getMediaColor, getMediaIcon} from "@/lib/utils/functions";


interface MediaIconProps {
    size?: number;
    className?: string;
    mediaType: MediaType | "user";
}


export const MediaIcon = ({ mediaType, size, className }: MediaIconProps) => {
    const IconComp = getMediaIcon(mediaType);
    if (!IconComp) return null;
    return (
        <IconComp
            size={size ?? 18}
            className={className}
            style={{ color: getMediaColor(mediaType) }}
        />
    );
};
