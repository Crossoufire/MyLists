import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";


export const PageInput = ({ initPage, totalPages, updatePage }) => {
    const [currentPage, setCurrentPage] = useState(initPage || 0);

    useEffect(() => {
        setCurrentPage(initPage);
    }, [initPage]);

    const handlePageOnBlur = async (ev) => {
        ev.preventDefault();
        if (currentPage === initPage) return;
        if (currentPage > totalPages || currentPage < 0) {
            return setCurrentPage(initPage);
        }
        await updatePage.mutateAsync({ payload: currentPage });
    };

    return (
        <div className="flex justify-between items-center">
            <div>Pages</div>
            <div className="w-[140px]">
                <Input
                    value={currentPage}
                    disabled={updatePage.isPending}
                    onBlur={(ev) => handlePageOnBlur(ev)}
                    onChange={(ev) => setCurrentPage(ev.target.value)}
                    className={"w-[60px] text-base border-none bg-transparent cursor-pointer inline-block"}
                />
                <span> / </span>
                <span>{totalPages}</span>
            </div>
        </div>
    );
};
