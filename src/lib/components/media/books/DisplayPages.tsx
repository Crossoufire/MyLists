import {Play} from "lucide-react";
import {Status} from "@/lib/server/utils/enums";


interface DisplayPagesProps {
    status: Status;
    pages: number | null;
    total: number | null;
}


export const DisplayPages = ({ pages, total, status }: DisplayPagesProps) => {
    if (status === Status.PLAN_TO_PLAY) {
        return null;
    }

    return (
        <div className="flex gap-x-1 items-center">
            <Play size={16} className="mt-0.5"/>
            {pages ? pages : "--"}/{total ? total : "?"}
        </div>
    );
}
