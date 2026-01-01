import {Globe, Lock, Shield} from "lucide-react";
import {MediaType, PrivacyType} from "@/lib/utils/enums";
import {getThemeColor, THEME_ICONS_MAP} from "@/lib/utils/colors-and-icons";


interface MainThemeIconProps {
    size?: number;
    className?: string;
    type: MediaType | "overview" | "all";
}


export const MainThemeIcon = ({ type, size, className }: MainThemeIconProps) => {
    const IconComp = THEME_ICONS_MAP[type];
    if (!IconComp) return null;

    return (
        <IconComp
            size={size ?? 18}
            className={className}
            style={{ color: getThemeColor(type) }}
        />
    );
};


export const PrivacyIcon = ({ type }: { type: PrivacyType }) => {
    switch (type) {
        case PrivacyType.PUBLIC:
            return <Globe className="size-3 text-emerald-400"/>;
        case PrivacyType.PRIVATE:
            return <Lock className="size-3 text-red-400"/>;
        case PrivacyType.RESTRICTED:
        default:
            return <Shield className="size-3 text-amber-400"/>;
    }
};
