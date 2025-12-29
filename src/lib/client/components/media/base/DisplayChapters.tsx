import {Status} from "@/lib/utils/enums";


interface DisplayChaptersProps {
    status: Status;
    total?: number | null;
    currentChapter: number | null;
}


export const DisplayChapters = ({ currentChapter, total, status }: DisplayChaptersProps) => {
    if (status === Status.PLAN_TO_READ) {
        return null;
    }

    return (
        <div className="flex gap-x-1 items-center">
            ch. {currentChapter ? currentChapter : "-"}{total ? "/" + total : ""}
        </div>
    );
}
