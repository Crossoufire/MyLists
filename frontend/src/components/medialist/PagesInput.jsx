import {useEffect, useState} from "react";
import {Input} from "@/components/ui/input";


export const PagesInput = ({ isCurrent, initPage, totalPages, updatePage }) => {
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
        <div className="flex justify-center items-center h-[28px]">
            {isCurrent ?
                <Input
                    value={currentPage}
                    disabled={updatePage.isPending}
                    onBlur={(ev) => handlePageOnBlur(ev)}
                    onChange={(ev) => setCurrentPage(ev.target.value)}
                    className="w-[40px] border-none cursor-pointer text-base p-0"
                />
                :
                <>{initPage} </>
            }
            / {totalPages}
        </div>
    )
};
