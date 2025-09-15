import {cn} from "@/lib/utils/helpers";


interface AvatarCirclesProps {
    className?: string,
    avatarUrls: Array<string>,
}


export const AvatarCircles = ({ className, avatarUrls }: AvatarCirclesProps) => {
    const showPeople = Math.min(avatarUrls.length, 4);
    const rest = avatarUrls.length - showPeople;

    return (
        <div className={cn("flex -space-x-2.5 max-sm:hidden", className)}>
            {avatarUrls.slice(0, showPeople).map((avatarUrl, idx) =>
                <img
                    key={idx}
                    src={avatarUrl}
                    alt={"Avatar " + (idx + 1)}
                    className="size-5 rounded-full border-1 border-black bg-background"
                />
            )}
            {rest > 0 &&
                <span className="flex size-5 items-center justify-center rounded-full border-1 text-center text-xs font-medium
                border-black bg-neutral-300 text-black">
                    +{rest}
                </span>
            }
        </div>
    );
};
