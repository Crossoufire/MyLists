import {useMemo, useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {useSearch} from "@tanstack/react-router";
import {BlockLink} from "@/lib/components/app/BlockLink";
import {CircleCheck, Heart, Settings2} from "lucide-react";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {RedoSystem} from "@/lib/components/media-list/RedoSystem";
import {TablePagination} from "@/lib/components/app/TablePagination";
import {DisplayRating} from "@/lib/components/media-list/DisplayRating";
import {QuickAddMedia} from "@/lib/components/media-list/QuickAddMedia";
import {CommentPopover} from "@/lib/components/media-list/CommentPopover";
import {UserMediaEditDialog} from "@/lib/components/media-list/UserMediaEditDialog";
import {SpecificUserMediaData} from "@/lib/components/media-list/SpecificUserMediaData";
import {ColumnDef, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";


interface MediaTableProps {
    isCurrent: boolean;
    queryKey: string[];
    mediaType: MediaType;
    onChangePage: (data: any) => void;
    results: {
        items: Record<string, any>[];
        pagination: Record<string, any>;
    };
}


export const MediaTable = ({ isCurrent, mediaType, results, queryKey, onChangePage }: MediaTableProps) => {
    const { currentUser } = useAuth();
    const isConnected = !!currentUser;
    const [editingId, setEditingId] = useState(null);
    const allStatuses = Status.byMediaType(mediaType);
    const [dialogOpen, setDialogOpen] = useState(false);
    const filters = useSearch({ from: "/_private/list/$mediaType/$username" });
    const paginationState = { pageIndex: filters?.page ? filters.page - 1 : 0, pageSize: 25 };

    const onPaginationChange = (updater: any) => {
        onChangePage(updater(paginationState));
    };

    let listColumns = useMemo((): ColumnDef<typeof results.items[0]>[] => [
        {
            header: "Name",
            cell: ({ row: { original } }) => {
                return (
                    <BlockLink to={`/details/${mediaType}/${original.mediaId}`}>
                        <div className="flex items-center gap-3">
                            {original.mediaName}
                            {!isCurrent && original.common && <CircleCheck className="h-4 w-4 text-green-500"/>}
                        </div>
                    </BlockLink>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
        },
        ...(mediaType === MediaType.MOVIES ? [] : [
            {
                header: "Progress",
                cell: ({ row: { original } }: { row: { original: any } }) => (
                    <div className="flex items-center">
                        <SpecificUserMediaData
                            userMedia={original}
                            mediaType={mediaType}
                        />
                    </div>
                ),
            },
        ]),
        {
            header: "Information",
            cell: ({ row: { original } }) => {
                return (
                    <div className="flex items-center gap-3">
                        <DisplayRating
                            rating={original.rating}
                            ratingSystem={original.ratingSystem}
                        />
                        <RedoSystem
                            userMedia={original}
                            mediaType={mediaType}
                        />
                        {original.favorite && <Heart className="w-4 h-4 text-red-500"/>}
                        {original.comment && <CommentPopover content={original.comment}/>}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row: { original } }) => {
                if (!isConnected) return null;
                if (isCurrent) {
                    return (
                        <div role="button" className="flex items-center justify-center" onClick={() => {
                            setDialogOpen(true);
                            setEditingId(original.mediaId);
                        }}>
                            <Settings2 className="w-4 h-4 opacity-70"/>
                        </div>
                    );
                }
                if (!isCurrent && !original.common) {
                    return (
                        <div className="flex items-center justify-center">
                            <QuickAddMedia
                                queryKey={queryKey}
                                mediaType={mediaType}
                                allStatuses={allStatuses}
                                mediaId={original.mediaId}
                            />
                        </div>
                    );
                }
            },
        },
    ], [isCurrent, isConnected, mediaType, queryKey, allStatuses]);

    const table = useReactTable({
        columns: listColumns,
        manualFiltering: true,
        manualPagination: true,
        data: results.items ?? [],
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
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map(headerGroup =>
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header =>
                                    <TableHead key={header.id}>
                                        {flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                )}
                            </TableRow>
                        )}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows?.length ?
                            table.getRowModel().rows.map(row =>
                                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                                    {row.getVisibleCells().map(cell =>
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
                userMedia={getCurrentEditingItem()}
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
