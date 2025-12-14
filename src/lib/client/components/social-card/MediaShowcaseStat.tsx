import {Film, Plus} from "lucide-react";
import {getAccentClasses} from "@/lib/client/social-card/media.config";
import {MediaShowcaseData, MediaTypeConfig} from "@/lib/client/social-card/types";


interface MediaShowcaseStatProps {
    mediaConfig: MediaTypeConfig;
    data: MediaShowcaseData | undefined;
    onEdit: (slotIndex: number) => void;
}


export function MediaShowcaseStat({ data, mediaConfig, onEdit }: MediaShowcaseStatProps) {
    const accent = getAccentClasses(mediaConfig.id);
    const movies = data ?? [null, null, null, null];

    return (
        <div className="grid h-full grid-cols-4 gap-2 p-2">
            {movies.map((movie, idx) => (
                <div key={idx} className="group/poster relative h-full">
                    {movie ?
                        <div className="">
                            <div className="">
                                <img
                                    alt={movie.name}
                                    src={movie.mediaCover}
                                    className="w-[188px] h-[258px]"
                                />
                            </div>

                            <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0
                            transition-opacity group-hover/poster:opacity-100">
                                <span className="line-clamp-2 px-1 text-center text-xs font-medium">
                                    {movie.name}
                                </span>
                            </div>
                        </div>
                        :
                        <button
                            onClick={() => onEdit(idx)}
                            className={`flex h-full w-full cursor-pointer flex-col items-center justify-center gap-1 
                            rounded border-2 border-dashed border-gray-600 transition-colors 
                            hover:${accent.border} hover:${accent.bg}/5`}
                        >
                            <Plus className="size-6 text-gray-500"/>
                            <span className="text-xs text-gray-400">
                                Add
                            </span>
                        </button>
                    }
                </div>
            ))}
        </div>
    );
}
