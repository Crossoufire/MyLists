import {Status} from "@/lib/utils/enums";


interface DisplayPagesProps {
    status: Status;
    total?: number | null;
    currentPage: number | null;
}


export const DisplayPages = ({ currentPage, total, status }: DisplayPagesProps) => {
    if (status === Status.PLAN_TO_READ) {
        return null;
    }

    return (
        <div className="flex gap-x-1 items-center">
            p. {currentPage ? currentPage : "-"}{total ? "/" + total : ""}
        </div>
    );
}
