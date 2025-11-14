import {cn} from "@/lib/utils/helpers";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";


interface AvatarCirclesProps {
    className?: string,
    avatarData: {
        name: string,
        image: string | null,
    }[],
}


export const AvatarCircles = ({ className, avatarData }: AvatarCirclesProps) => {
    const showPeople = Math.min(avatarData.length, 4);
    const rest = avatarData.length - showPeople;

    return (
        <div className={cn("flex -space-x-1.5 max-sm:hidden", className)}>
            {avatarData.slice(0, showPeople).map((data, idx) =>
                <ProfileIcon
                    key={idx}
                    fallbackSize="text-[9px]"
                    className="size-5 border-1 border-black"
                    user={{ image: data.image, name: data.name }}
                />
            )}
            {rest > 0 &&
                <span className="z-5 flex size-5 items-center justify-center rounded-full border-1 text-center text-xs font-medium
                border-black bg-neutral-300 text-black">
                    +{rest}
                </span>
            }
        </div>
    );
};
