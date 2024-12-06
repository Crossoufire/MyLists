import {useMemo, useState} from "react";
import {useAuth} from "@mylists/api/src";
import {BlockLink} from "@/components/app/BlockLink";
import {TablePagination} from "@/components/app/TablePagination";
import {DisplayRating} from "@/components/media-list/DisplayRating";
import {QuickAddMedia} from "@/components/media-list/QuickAddMedia";
import {CommentPopover} from "@/components/media-list/CommentPopover";
import {Route} from "@/routes/_private/list/$mediaType/$username/route";
import {LuCircleCheck, LuHeart, LuRefreshCw, LuSettings2} from "react-icons/lu";
import {UserMediaEditDialog} from "@/components/media-list/UserMediaEditDialog";
import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {SpecificUserMediaData} from "@/components/media-list/SpecificUserMediaData";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";


export const MediaTable = ({ isCurrent, mediaType, mediaList, pagination, queryKey, onChangePage }) => {
    const { currentUser } = useAuth();
    const filters = Route.useSearch();
    const isConnected = !!currentUser;
    const [editingId, setEditingId] = useState(null);
    const [dialogOpen, setDialogOpen] = useState(false);
    const paginationState = { pageIndex: filters?.page ? filters.page - 1 : 0, pageSize: 25 };

    const onPaginationChange = (paginateFunc) => {
        onChangePage(paginateFunc(paginationState));
    };

    let listColumns = useMemo(() => [
        {
            header: "Name",
            cell: ({ row }) => {
                return (
                    <BlockLink to={`/details/${mediaType}/${row.original.media_id}`}>
                        <div className="flex items-center gap-3">
                            {row.original.media_name}
                            {!isCurrent && row.original.common && <LuCircleCheck className="h-4 w-4 text-green-500"/>}
                        </div>
                    </BlockLink>
                );
            },
        },
        {
            accessorKey: "status",
            header: "Status",
        },
        ...(mediaType === "movies" ? [] : [
            {
                header: "Progress",
                cell: ({ row }) => (
                    <div className="flex items-center">
                        <SpecificUserMediaData mediaType={mediaType} userMedia={row.original}/>
                    </div>
                ),
            },
        ]),
        {
            header: "Information",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-3">
                        <DisplayRating rating={row.original.rating}/>
                        {row.original.redo > 0 &&
                            <div className="flex items-center gap-1">
                                <LuRefreshCw className="text-green-500"/> {row.original.redo}
                            </div>
                        }
                        {row.original.favorite && <LuHeart className="text-red-500"/>}
                        {row.original.comment && <CommentPopover content={row.original.comment}/>}
                    </div>
                );
            },
        },
        {
            id: "actions",
            cell: ({ row }) => {
                if (!isConnected) return null;
                if (isCurrent) {
                    return (
                        <div role="button" className="flex items-center justify-center" onClick={() => {
                            setDialogOpen(true);
                            setEditingId(row.original.media_id);
                        }}>
                            <LuSettings2 className="opacity-70"/>
                        </div>
                    );
                }
                if (!isCurrent && !row.original.common) {
                    return (
                        <div className="flex items-center justify-center">
                            <QuickAddMedia
                                queryKey={queryKey}
                                mediaType={mediaType}
                                mediaId={row.original.media_id}
                                allStatus={pagination.all_status}
                            />
                        </div>
                    );
                }
            },
        },
    ], [isCurrent, isConnected, mediaType, queryKey, pagination.all_status]);

    const table = useReactTable({
        columns: listColumns,
        manualFiltering: true,
        data: mediaList ?? [],
        manualPagination: true,
        rowCount: pagination.total ?? 0,
        getCoreRowModel: getCoreRowModel(),
        onPaginationChange: onPaginationChange,
        state: { pagination: paginationState },
    });

    const getCurrentEditingItem = () => {
        if (!editingId) return null;
        return mediaList.find(item => item.media_id === editingId);
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
                <TablePagination table={table} withSelection={false}/>
            </div>
            {dialogOpen &&
                <UserMediaEditDialog
                    queryKey={queryKey}
                    mediaType={mediaType}
                    userMedia={getCurrentEditingItem()}
                    onOpenChange={() => {
                        setDialogOpen(false);
                        setEditingId(null);
                    }}
                />
            }
        </>
    );
};


function getColumnWidth(colId) {
    const columnWidths = {
        "Name": "auto",
        "status": "auto",
        "Progress": "auto",
        "Information": "auto",
        "actions": "80px",
    };

    return columnWidths[colId] || "auto";
}
