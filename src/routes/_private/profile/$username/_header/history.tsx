import {useMemo, useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {formatDateTime} from "@/lib/utils/functions";
import {Checkbox} from "@/lib/components/ui/checkbox";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Payload} from "@/lib/components/general/Payload";
import {SearchType} from "@/lib/server/types/base.types";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {useDebounceCallback} from "@/lib/hooks/use-debounce";
import {createFileRoute, Link} from "@tanstack/react-router";
import {TablePagination} from "@/lib/components/general/TablePagination";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {allUpdatesOptions, queryKeys} from "@/lib/react-query/query-options/query-options";
import {useDeleteUpdatesMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";
import {flexRender, getCoreRowModel, OnChangeFn, PaginationState, useReactTable} from "@tanstack/react-table";


export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    validateSearch: ({ search }) => search as SearchType,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { username }, deps }) => {
        return queryClient.ensureQueryData(allUpdatesOptions(username, deps.search));
    },
    component: AllUpdates,
});


function AllUpdates() {
    const { currentUser } = useAuth();
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { username } = Route.useParams();
    const isCurrent = (currentUser?.name === username);
    const [rowSelected, setRowSelected] = useState({});
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const apiData = useSuspenseQuery(allUpdatesOptions(username, filters)).data;
    const paginationState = { pageIndex: filters?.page ? (filters.page - 1) : 0, pageSize: 25 };
    const deleteUpdateMutation = useDeleteUpdatesMutation(queryKeys.allUpdatesKey(username, filters));

    const setFilters = async (filtersData: SearchType) => {
        await navigate({ search: (prev) => ({ ...prev, ...filtersData }), resetScroll: false });
    };

    const resetFilters = async () => {
        await navigate({ search: {}, resetScroll: false });
        setCurrentSearch("");
    };

    const onPaginationChange: OnChangeFn<PaginationState> = (updaterOrValue) => {
        const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(paginationState) : updaterOrValue;
        setFilters({ page: newPagination.pageIndex + 1 });
    };

    const historyColumns = useMemo(() => [
        {
            id: "select",
            header: ({ table }: any) => (
                <>
                    {isCurrent &&
                        <Checkbox
                            aria-label="Select all"
                            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                        />
                    }
                </>
            ),
            cell: ({ row }: any) => (
                <>
                    {isCurrent &&
                        <Checkbox
                            aria-label="Select row"
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => row.toggleSelected(!!value)}
                        />
                    }
                </>
            ),
        },
        {
            accessorKey: "mediaName",
            header: "Name",
            cell: ({ row: { original } }: any) => {
                return (
                    <div className="flex items-center gap-4">
                        <MediaAndUserIcon type={original.mediaType} size={16}/>
                        <Link
                            to="/details/$mediaType/$mediaId"
                            params={{ mediaType: original.mediaType, mediaId: original.mediaId }}
                            search={{ external: false }}
                        >
                            {original.mediaName}
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
        state: { rowSelection: rowSelected, pagination: paginationState },
    });

    const deleteSelectedRows = async () => {
        const selectedIds = Object.keys(rowSelected).map(key => table.getRow(key).original.id);
        await deleteUpdateMutation.mutateAsync({ updateIds: selectedIds });
        setRowSelected({});
    };

    useDebounceCallback<SearchType>(currentSearch, 300, setFilters, { search: currentSearch, page: 1 });

    return (
        <PageTitle title="History" subtitle="History of all my media updates">
            <div className="w-[900px] mx-auto mt-3">
                <div className="flex justify-between items-center pb-3">
                    <div className="flex items-center gap-2">
                        <Input
                            className="w-56"
                            value={currentSearch}
                            placeholder="Search by name..."
                            disabled={deleteUpdateMutation.isPending}
                            onChange={(ev) => setCurrentSearch(ev.target.value)}
                        />
                        {currentSearch &&
                            <Button size="sm" onClick={resetFilters} disabled={deleteUpdateMutation.isPending}>
                                Cancel
                            </Button>
                        }
                    </div>
                    {isCurrent &&
                        <Button disabled={Object.keys(rowSelected).length === 0 || deleteUpdateMutation.isPending} onClick={deleteSelectedRows}>
                            Delete Selected
                        </Button>
                    }
                </div>
                <div className="rounded-md border">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map(headerGroup =>
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map(header =>
                                        <TableHead key={header.id}>
                                            {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )}
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ?
                                table.getRowModel().rows.map(row => {
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={(deleteUpdateMutation.isPending && row.getIsSelected()) ? "opacity-50" : ""}
                                        >
                                            {row.getVisibleCells().map(cell =>
                                                <TableCell key={cell.id}>
                                                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                                </TableCell>
                                            )}
                                        </TableRow>
                                    );
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
