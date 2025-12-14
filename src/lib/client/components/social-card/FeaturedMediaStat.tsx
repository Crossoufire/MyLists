import {Film, Play, Plus} from "lucide-react";
import {getAccentClasses} from "@/lib/client/social-card/media.config";
import {FeaturedMediaData, MediaTypeConfig} from "@/lib/client/social-card/types";
import {cn} from "@/lib/utils/helpers";


interface FeaturedMediaStatProps {
    onEdit: () => void;
    data: FeaturedMediaData;
    mediaConfig: MediaTypeConfig;
}


export function FeaturedMediaStat({ data, mediaConfig, onEdit }: FeaturedMediaStatProps) {
    const accent = getAccentClasses(mediaConfig.id);

    if (data) {
        return (
            <div className="flex h-full flex-col items-center justify-center p-2">
                <div className="group/poster relative h-full w-full">
                    <div
                        className="flex h-full w-full items-center justify-center rounded bg-linear-to-br
                        from-red-500/20 to-orange-500/40"
                    >
                        <Play className={`size-12 ${accent.text} opacity-50`}/>
                    </div>

                    <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0
                    transition-opacity group-hover/poster:opacity-100">
                        <span className="px-2 text-center text-xs font-medium">
                            {data.name}
                        </span>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col items-center justify-center p-2">
            <button
                onClick={onEdit}
                className={cn(
                    "flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 rounded border-2 " +
                    "border-dashed border-gray-600 transition-colors",
                    `hover:${accent.border}`,
                    `hover:${accent.bg}/5`
                )}
            >
                <Plus className="size-8 text-gray-500"/>
                <span className="text-xs text-gray-400">
                    Add poster
                </span>
            </button>
        </div>
    );
}
