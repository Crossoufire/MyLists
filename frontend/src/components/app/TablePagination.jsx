import {Button} from "@/components/ui/button";
import {FaArrowLeft, FaArrowRight, FaCaretLeft, FaCaretRight} from "react-icons/fa";


export function TablePagination({ table }) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex-1 text-sm text-muted-foreground">
                {table.getFilteredSelectedRowModel().rows.length} of{" "}
                {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
            <div className="flex items-center space-x-6 lg:space-x-8">
                <div className="flex w-[100px] items-center justify-center text-sm font-medium">
                    Page {table.getState().pagination.pageIndex + 1} of{" "}
                    {table.getPageCount() === 0 ? 1 : table.getPageCount()}
                </div>
                <div className="flex items-center space-x-2">
                    <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => table.setPageIndex(0)} disabled={!table.getCanPreviousPage()}>
                        <span className="sr-only">Go to first page</span>
                        <FaArrowLeft className="h-4 w-4"/>
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.previousPage()}
                            disabled={!table.getCanPreviousPage()}>
                        <span className="sr-only">Go to previous page</span>
                        <FaCaretLeft className="h-4 w-4"/>
                    </Button>
                    <Button variant="outline" className="h-8 w-8 p-0" onClick={() => table.nextPage()}
                            disabled={!table.getCanNextPage()}>
                        <span className="sr-only">Go to next page</span>
                        <FaCaretRight className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" className="hidden h-8 w-8 p-0 lg:flex" disabled={!table.getCanNextPage()}
                            onClick={() => table.setPageIndex(table.getPageCount() - 1)}>
                        <span className="sr-only">Go to last page</span>
                        <FaArrowRight className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
