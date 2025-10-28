import {Play} from "lucide-react";
import {Status} from "@/lib/utils/enums";


interface DisplayPlaytimeProps {
    status: Status;
    playtime: number | null;
}


export const DisplayPlaytime = ({ playtime, status }: DisplayPlaytimeProps) => {
    if (status === Status.PLAN_TO_PLAY) {
        return null;
    }

    return (
        <div className="flex gap-x-1 items-center">
            <Play size={16} className="mt-0.5"/>
            {playtime ? playtime / 60 : "-"} h
        </div>
    );
};