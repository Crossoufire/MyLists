import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {useLoading} from "@/hooks/LoadingHook";


export const PagesInput = ({ isCurrent, initPage, totalPages, status, updatePage }) => {
    const [isLoading, handleLoading] = useLoading();
    const [page, setPage] = useState(initPage || 0);
    const [backupPage, setBackupPage] = useState(initPage || 0);

    useEffect(() => {
        setPage(initPage);
    }, [initPage]);

    const handlePageOnBlur = async () => {
        if (parseInt(page) === backupPage) {
            return;
        }

        const response = await handleLoading(updatePage, page);
        if (response) {
            setBackupPage(parseInt(page));
        } else {
            setPage(backupPage);
        }
    }

    const onPageChange = (ev) => {
        setPage(ev.target.value);
    }

    return (
        <div className="flex justify-center items-center h-[32px] w-full opacity-90 bg-gray-900 border
        border-x-black border-b-black rounded-bl-md rounded-br border-t-transparent">
            {(isCurrent && status !== "Plan to Read") ?
                <Input
                    value={isLoading ? "..." : page}
                    onBlur={(ev) => handlePageOnBlur(ev)}
                    onChange={onPageChange}
                    className="w-[50px] border-none cursor-pointer"
                    disabled={isLoading}
                />
                :
                <>{page} </>
            }
            / {totalPages}
        </div>
    )
};
