import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";
import {useLoading} from "@/hooks/LoadingHook";


export const PageInput = ({ initPage, totalPages, updatePage }) => {
    const [page, setPage] = useState(initPage || 0);
    const [isLoading, handleLoading] = useLoading();
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
        <div className="flex justify-between items-center">
            <div>Pages</div>
            <div className="w-[140px]">
                <Input
                    value={isLoading ? "..." : page}
                    onBlur={(ev) => handlePageOnBlur(ev)}
                    onChange={onPageChange}
                    className="w-[60px] text-base border-none bg-transparent cursor-pointer inline-block"
                    disabled={isLoading}
                />
                <span> / </span>
                <span>{totalPages}</span>
            </div>
        </div>
    );
};
