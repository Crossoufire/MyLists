import {useEffect, useState} from "react";
import {Button} from "@/lib/components/ui/button";


interface PaginationProps {
    onChangePage: any;
    totalPages: number;
    currentPage: number;
}


export const Pagination = ({ currentPage, totalPages, onChangePage }: PaginationProps) => {
    const [pages, setPages] = useState<any>([]);

    useEffect(() => {
        const generatePages = () => {
            const pageArr = [];
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

    return (
        <ul className="flex justify-center items-center p-0 mt-8">
            {pages.map((page: number | string, idx: number) => (
                <li key={idx} className="px-3">
                    {page === "..." ?
                        <span className="ellipsis">...</span>
                        :
                        <Button variant={page === currentPage ? "secondary" : "ghost"} onClick={() => onChangePage(page)}>
                            {page}
                        </Button>
                    }
                </li>
            ))}
        </ul>
    );
};


