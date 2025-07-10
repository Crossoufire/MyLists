import {Button} from "@/lib/components/ui/button";
import {ChevronLeft, ChevronRight} from "lucide-react";


interface PaginationProps {
    showNav?: boolean;
    totalPages: number;
    currentPage: number;
    maxVisible?: number;
    onChangePage: (page: number) => void;
}


export const Pagination = ({ currentPage, totalPages, onChangePage, showNav = true, maxVisible = 6 }: PaginationProps) => {
    if (totalPages <= 1) {
        return null;
    }

    const safePage = Math.max(1, Math.min(currentPage, totalPages));

    const generatePages = (): ("..." | number)[] => {
        const pages: ("..." | number)[] = [];

        if (totalPages <= maxVisible) {
            return Array.from({ length: totalPages }, (_, i) => i + 1);
        }

        const sidePages = Math.floor((maxVisible - 3) / 2);
        pages.push(1);

        let start = Math.max(2, safePage - sidePages);
        let end = Math.min(totalPages - 1, safePage + sidePages);

        if (start <= 3) {
            start = 2;
            end = Math.min(totalPages - 1, maxVisible - 1);
        }

        if (end >= totalPages - 2) {
            end = totalPages - 1;
            start = Math.max(2, totalPages - maxVisible + 2);
        }

        if (start > 2) {
            pages.push("...");
        }

        for (let i = start; i <= end; i++) {
            pages.push(i);
        }

        if (end < totalPages - 1) {
            pages.push("...");
        }

        if (totalPages > 1) {
            pages.push(totalPages);
        }

        return pages;
    };

    const pages = generatePages();
    const canGoPrevious = safePage > 1;
    const canGoNext = safePage < totalPages;

    const handlePageChange = (page: number) => {
        if (page >= 1 && page <= totalPages && page !== currentPage) {
            onChangePage(page);
        }
    };

    return (
        <nav className="flex justify-center items-center mt-8" aria-label="Pagination navigation">
            <ul className="flex items-center gap-2">
                {showNav &&
                    <li>
                        <Button
                            size="sm"
                            disabled={!canGoPrevious}
                            aria-label="Go to previous page"
                            variant={canGoPrevious ? "secondary" : "ghost"}
                            onClick={() => handlePageChange(safePage - 1)}
                        >
                            <ChevronLeft className="size-5"/>
                        </Button>
                    </li>
                }
                {pages.map((page, idx) =>
                    <li key={`${page}-${idx}`}>
                        {page === "..." ?
                            <span className="px-3 py-2 text-sm text-muted-foreground" aria-hidden="true">...</span>
                            :
                            <Button
                                size="sm"
                                aria-label={`Go to page ${page}`}
                                onClick={() => handlePageChange(page)}
                                variant={page === safePage ? "default" : "ghost"}
                                aria-current={page === safePage ? "page" : undefined}
                            >
                                {page}
                            </Button>
                        }
                    </li>
                )}
                {showNav &&
                    <li>
                        <Button
                            size="sm"
                            disabled={!canGoNext}
                            aria-label="Go to next page"
                            variant={canGoNext ? "secondary" : "ghost"}
                            onClick={() => handlePageChange(safePage + 1)}
                        >
                            <ChevronRight className="size-5"/>
                        </Button>
                    </li>
                }
            </ul>
        </nav>
    );
};
