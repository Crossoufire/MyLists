import {useMemo, useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {useSearch} from "@tanstack/react-router";
import {MediaType} from "@/lib/server/utils/enums";
import {mediaConfig} from "@/lib/components/media-config";
import {ListPagination, UserMediaItem} from "@/lib/types/query.options.types";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {TablePagination} from "@/lib/components/general/TablePagination";
import {UserMediaEditDialog} from "@/lib/components/media/base/UserMediaEditDialog";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";
import {flexRender, getCoreRowModel, OnChangeFn, PaginationState, useReactTable} from "@tanstack/react-table";
import {MediaListArgs} from "@/lib/types/zod.schema.types";


interface MediaTableProps {
    isCurrent: boolean;
    mediaType: MediaType;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
    onChangePage: (filters: Partial<MediaListArgs>) => void;
    results: {
        items: UserMediaItem[];
        pagination: ListPagination;
    };
}


export const MediaTable = ({ isCurrent, mediaType, results, queryKey, onChangePage }: MediaTableProps) => {
    const { currentUser } = useAuth();
    const isConnected = !!currentUser;
    const [dialogOpen, setDialogOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const filters = useSearch({ from: "/_private/list/$mediaType/$username" });
    const paginationState = { pageIndex: filters?.page ? (filters.page - 1) : 0, pageSize: 25 };

    const onPaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
        const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(paginationState) : updaterOrValue;
        onChangePage({ page: newPagination.pageIndex + 1 });
    };

    const handleEdit = (mediaId: number) => {
        setEditingId(mediaId);
        setDialogOpen(true);
    };

    const listColumns = useMemo(() => {
        const columnGenerator = mediaConfig[mediaType].mediaListColumns;
        return columnGenerator({ isCurrent, isConnected, mediaType, queryKey, onEdit: handleEdit });
    }, [isCurrent, isConnected, mediaType, queryKey]);

    const table = useReactTable({
        manualFiltering: true,
        manualPagination: true,
        data: results.items ?? [],
        columns: listColumns as any,
        getCoreRowModel: getCoreRowModel(),
        onPaginationChange: onPaginationChange,
        state: { pagination: paginationState },
        rowCount: results.pagination.totalItems ?? 0,
    });

    const getCurrentEditingItem = () => {
        if (!editingId) return null;
        return results.items.find((item) => item.mediaId === editingId);
    };

    return (
        <>
            <div className="rounded-md border p-3 pt-0">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) =>
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) =>
                                    <TableHead key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                )}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ?
                            table.getRowModel().rows.map((row) =>
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map((cell) =>
                                        <TableCell key={cell.id} style={{ width: getColumnWidth(cell.column.id) }}>
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </TableCell>
                                    )}
                                </TableRow>
                            )
                            :
                            <TableRow>
                                <TableCell colSpan={listColumns.length} className="h-24 text-center">
                                    No results.
                                </TableCell>
                            </TableRow>
                        }
                    </TableBody>
                </Table>
            </div>
            <div className="mt-3">
                <TablePagination
                    table={table}
                    withSelection={false}
                />
            </div>
            <UserMediaEditDialog
                queryKey={queryKey}
                mediaType={mediaType}
                dialogOpen={dialogOpen}
                userMedia={getCurrentEditingItem()!}
                onOpenChange={() => {
                    setEditingId(null);
                    setDialogOpen(false);
                }}
            />
        </>
    );
};


function getColumnWidth(colId: string) {
    const columnWidths: Record<string, string> = {
        "Name": "auto",
        "status": "auto",
        "Progress": "auto",
        "Information": "250px",
        "actions": "80px",
    };
    return columnWidths[colId] || "auto";
}
