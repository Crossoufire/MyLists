import {cn} from "@/lib/utils/helpers";


interface AvatarCirclesProps {
    className?: string,
    avatarUrls: Array<string>,
}


const AvatarCircles = ({ className, avatarUrls }: AvatarCirclesProps) => {
    const showPeople = Math.min(avatarUrls.length, 4);
    const rest = avatarUrls.length - showPeople;

    return (
        <div className={cn("flex -space-x-2.5 max-sm:hidden", className)}>
            {avatarUrls.slice(0, showPeople).map((avatarUrl, idx) =>
                <img
                    key={idx}
                    src={avatarUrl}
                    alt={"Avatar " + (idx + 1)}
                    className="h-6 w-6 rounded-full border-2 border-neutral-900"
                />
            )}
            {rest > 0 &&
                <span className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-center text-xs font-medium
                border-neutral-900 bg-neutral-300 text-black">
                    +{rest}
                </span>
            }
        </div>
    );
};

export default AvatarCircles;