import {Status} from "@/lib/utils/enums";
import {canShowProgress} from "@/lib/utils/media/status";
import {DEFAULT_DASH_FALLBACK} from "@/lib/utils/constants";


interface DisplayPagesProps {
    status: Status;
    total?: number | null;
    currentPage: number | null;
}


export const DisplayPages = ({ currentPage, total, status }: DisplayPagesProps) => {
    if (!canShowProgress(status)) {
        return null;
    }

    return (
        <div className="flex gap-x-1 items-center">
            p. {currentPage ? currentPage : DEFAULT_DASH_FALLBACK}{total ? "/" + total : ""}
        </div>
    );
}
