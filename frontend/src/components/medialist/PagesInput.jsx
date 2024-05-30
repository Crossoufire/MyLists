// noinspection JSCheckFunctionSignatures

import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {useLoading} from "@/hooks/LoadingHook";


export const PagesInput = ({ isCurrent, status, initPage, totalPages, updatePage }) => {
    const [isLoading, handleLoading] = useLoading();
    const [page, setPage] = useState(initPage || 0);
    const [backupPage, setBackupPage] = useState(initPage || 0);

    useEffect(() => {
        if (status === "Completed") {
            setPage(totalPages);
        }
    }, [status]);

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
    };

    return (
        <div className="flex justify-center items-center h-[28px]">
            {isCurrent ?
                <Input
                    value={page}
                    disabled={isLoading}
                    onBlur={(ev) => handlePageOnBlur(ev)}
                    onChange={(ev) => setPage(ev.target.value)}
                    className="w-[40px] border-none cursor-pointer text-base p-0"
                />
                :
                <>{page} </>
            }
            / {totalPages}
        </div>
    )
};
