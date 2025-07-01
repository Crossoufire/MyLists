import {zeroPad} from "@/lib/utils/functions";
import {RefreshCw, RotateCw} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";


interface RedoSystemProps {
    mediaType: MediaType;
    userMedia: ListItems[0];
}


export const RedoSystem = ({ userMedia, mediaType }: RedoSystemProps) => {
    if (mediaType === MediaType.GAMES) {
        return null;
    }

    if (mediaType === MediaType.SERIES || mediaType === MediaType.ANIME) {
        const totalRedo = userMedia.redo2.reduce((a: any, b: any) => a + b, 0);

        if (totalRedo === 0) return null;

        return (
            <Popover>
                <PopoverTrigger>
                    <div className="flex items-center gap-x-2">
                        <RotateCw size={15} className="text-green-500"/>
                    </div>
                </PopoverTrigger>
                <PopoverContent className="w-40 px-5 pt-3 pb-3 max-h-[210px] overflow-auto" align="center">
                    <div className=" grid gap-3">
                        <div className="space-y-2">
                            {userMedia.redo2.map((season: any, idx: number) => (
                                <div key={idx} className="flex gap-3 items-center justify-between">
                                    <div className="text-sm font-medium leading-none">
                                        Season {zeroPad(idx + 1)}
                                    </div>
                                    <div className="text-sm font-medium">
                                        {season}x
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </PopoverContent>
            </Popover>
        );
    }

    if (userMedia.redo === 0) return null;

    return (
        <div className="flex items-center gap-1">
            <RefreshCw className="w-3.5 h-3.5 text-green-500"/>{userMedia.redo}
        </div>
    );
};