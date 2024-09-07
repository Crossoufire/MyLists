import {useMemo, useState} from "react";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useDebounce} from "@/hooks/DebounceHook";
import {formatDateTime} from "@/utils/functions";
import {Checkbox} from "@/components/ui/checkbox";
import {Payload} from "@/components/app/base/Payload";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaIcon} from "@/components/app/base/MediaIcon";
import {PageTitle} from "@/components/app/base/PageTitle";
import {TablePagination} from "@/components/app/TablePagination";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";
import {queryOptionsMap, useDeleteUpdateMutation} from "@/utils/mutations";
import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    component: AllUpdates,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { username }, deps }) => {
        return queryClient.ensureQueryData(queryOptionsMap.history(username, deps.search));
    },
});


function AllUpdates() {
    const navigate = useNavigate();
    const filters = Route.useSearch();
    const { username } = Route.useParams();
    const [rowSelected, setRowSelected] = useState({});
    const apiData = useSuspenseQuery(queryOptionsMap.history(username, filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const deleteMutation = useDeleteUpdateMutation(["history", username, filters]);
    const paginationState = { pageIndex: filters?.page ? filters.page - 1 : 0, pageSize: 25 };

    const setFilters = ({ pageIndex, pageSize, ...otherFilters }) => {
        const updatedFilters = { ...otherFilters, page: pageIndex + 1 };
        void navigate({ search: (prev) => ({ ...prev, ...updatedFilters }), resetScroll: false });
    };

    const resetFilters = async () => {
        await navigate({ search: {}, resetScroll: false });
        setCurrentSearch("");
    };

    const onPaginationChange = (paginateFunc) => {
        setFilters(paginateFunc(paginationState));
    };

    const historyColumns = useMemo(() => [
        {
            id: "select",
            header: ({ table }) => (
                <Checkbox
                    aria-label="Select all"
                    onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                    checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                />
            ),
            cell: ({ row }) => (
                <Checkbox
                    aria-label="Select row"
                    checked={row.getIsSelected()}
                    onCheckedChange={(value) => row.toggleSelected(!!value)}
                />
            ),
        },
        {
            accessorKey: "media_name",
            header: "Name",
            cell: ({ row }) => {
                return (
                    <div className="flex items-center gap-4">
                        <MediaIcon mediaType={row.original.media_type} size={16}/>
                        <Link to={`/details/${row.original.media_type}/${row.original.media_id}`}>
                            {row.original.media_name}
                        </Link>
                    </div>
                );
            },
        },
        {
            accessorKey: "update",
            header: "Update",
            cell: ({ row }) => <Payload update={row.original}/>,
        },
        {
            accessorKey: "timestamp",
            header: "Date",
            cell: ({ row }) => formatDateTime(row.original.timestamp, { includeTime: true, useLocalTz: true }),
        },

    ], []);

    const table = useReactTable({
        manualFiltering: true,
        manualPagination: true,
        columns: historyColumns,
        data: apiData?.items ?? [],
        rowCount: apiData?.total ?? 0,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelected,
        onPaginationChange: onPaginationChange,
        state: {
            rowSelection: rowSelected,
            pagination: paginationState,
        },
    });

    const deleteSelectedRows = async () => {
        const selectedIds = Object.keys(rowSelected).map(key => table.getRow(key).original.id);
        await deleteMutation.mutateAsync({ updateIds: selectedIds });
        setRowSelected({});
    };

    useDebounce(currentSearch, 300, setFilters, { search: currentSearch, pageIndex: 0 });

    return (
        <PageTitle title="History" subtitle="History of all my media updates">
            <div className="w-[900px] mx-auto mt-3">
                <div className="flex justify-between items-center pb-3">
                    <div className="flex items-center gap-2">
                        <Input
                            className="w-56"
                            value={currentSearch}
                            placeholder="Search by name..."
                            disabled={deleteMutation.isPending}
                            onChange={(ev) => setCurrentSearch(ev.target.value)}
                        />
                        {currentSearch &&
                            <Button size="sm" onClick={resetFilters} disabled={deleteMutation.isPending}>
                                Cancel
                            </Button>
                        }
                    </div>
                    <Button disabled={Object.keys(rowSelected).length === 0 || deleteMutation.isPending}
                    onClick={deleteSelectedRows}>
                        Delete Selected
                    </Button>
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup =>
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header =>
                                        <TableHead key={header.id}>
                                            {!header.isPlaceholder &&
                                                flexRender(header.column.columnDef.header, header.getContext())
                                            }
                                        </TableHead>
                                    )}
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ?
                                table.getRowModel().rows.map(row => {
                                    return (
                                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}
                                        className={(deleteMutation.isPending && row.getIsSelected()) ? "opacity-50" : ""}>
                                            {row.getVisibleCells().map(cell =>
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    )
                                })
                                :
                                <TableRow>
                                    <TableCell colSpan={historyColumns.length} className="h-24 text-center">
                                        No results.
                                    </TableCell>
                                </TableRow>
                            }
                        </TableBody>
                    </Table>
                </div>
                <div className="mt-3">
                    <TablePagination table={table}/>
                </div>
            </div>
        </PageTitle>
    );
}
