import {RotateCw} from "lucide-react";
import {zeroPad} from "@/lib/utils/functions";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractFollowsByType, ExtractListByType} from "@/lib/components/types";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";


interface DisplayTvRedoProps {
    userData: ExtractFollowsByType<typeof MediaType.SERIES | typeof MediaType.ANIME>
        | ExtractListByType<typeof MediaType.SERIES | typeof MediaType.ANIME>;
}


export const DisplayTvRedo = ({ userData }: DisplayTvRedoProps) => {
    const maxCount = Math.max(...userData.userMedia.redo2);
    const totalRedo = userData.userMedia.redo2.reduce((a, b) => a + b, 0);

    if (maxCount === 0) {
        return (
            <div className="flex items-center gap-x-2">
                <RotateCw size={15} className="text-green-500"/>
                <div>{totalRedo} {totalRedo > 1 ? "S." : ""}</div>
            </div>
        );
    }

    return (
        <Popover>
            <PopoverTrigger>
                <div className="flex items-center gap-x-2">
                    <RotateCw size={15} className="text-green-500"/>
                    <div>{totalRedo} {totalRedo > 1 ? "S." : ""}</div>
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-40 px-5 pt-3 pb-3 max-h-[210px] overflow-auto" align="center">
                <div className=" grid gap-3">
                    <div className="space-y-2">
                        {userData.userMedia.redo2.map((season, idx) => (
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
