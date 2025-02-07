import {getMediaColor, getMediaIcon} from "@/utils/functions";


export const MediaIcon = ({ mediaType, size, className }) => {
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
