import {useState, useEffect} from "react";
import {Button} from "@/components/ui/button";


export const Pagination = ({ currentPage, totalPages, onChangePage }) => {
    const [pages, setPages] = useState([]);

    useEffect(() => {
        const generatePages = () => {
            const pageArr = [];
            let i = 1;

            while (i <= totalPages) {
                if (i === 1 || i === totalPages || (i >= currentPage - 2 && i <= currentPage + 2)) {
                    pageArr.push(i);
                } else if (i === currentPage - 3 || i === currentPage + 3) {
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
             {pages.map((page, idx) => (
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


