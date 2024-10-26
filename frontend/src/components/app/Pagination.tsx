import {Button} from "@/components/ui/button";
import React, {useEffect, useState} from "react";


interface PaginationProps {
    totalPages: number;
    currentPage: number;
    onChangePage: (page: number) => void;
}


export const Pagination = ({currentPage, totalPages, onChangePage}: PaginationProps) => {
    const [pages, setPages] = useState<(number | string)[]>([]);

    useEffect(() => {
        const generatePages = () => {
            const pageArr: (number | string)[] = [];
            let i = 1;

            while (i <= totalPages) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    pageArr.push(i);
                }
                else if (i === currentPage - 3 || i === currentPage + 3) {
                    pageArr.push("...");
                }
                i++;
            }

            return pageArr;
        };

        setPages(generatePages());
    }, [currentPage, totalPages]);

    // @ts-ignore
    return (
        <ul className="flex justify-center items-center p-0 mt-8">
            {pages.map((page, idx) => (
                <li key={idx} className="px-3">
                    {page === "..." ?
                        <span className="ellipsis">...</span>
                        :
                        <Button variant={page === currentPage ? "secondary" : "ghost"} onClick={() => onChangePage(page as number)}>
                            {page}
                        </Button>
                    }
                </li>
            ))}
        </ul>
    );
};


