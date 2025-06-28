import {useMemo, useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {Input} from "@/lib/components/ui/input";
import {formatDateTime} from "@/lib/utils/functions";
import {Payload} from "@/lib/components/app/Payload";
import {Checkbox} from "@/lib/components/ui/checkbox";
import {useSuspenseQuery} from "@tanstack/react-query";
import {MediaAndUserIcon} from "@/lib/components/media/base/MediaAndUserIcon";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {useDebounceCallback} from "@/lib/hooks/use-debounce";
import {allUpdatesOptions} from "@/lib/react-query/query-options/query-options";
import {TablePagination} from "@/lib/components/app/TablePagination";
import {createFileRoute, Link, useNavigate} from "@tanstack/react-router";
import {flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";


export const Route = createFileRoute("/_private/profile/$username/_header/history")({
    validateSearch: ({ search }) => search as Record<string, any>,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { username }, deps }) => {
        return queryClient.ensureQueryData(allUpdatesOptions(username, deps.search));
    },
    component: AllUpdates,
});


function AllUpdates() {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const filters = Route.useSearch();
    const { username } = Route.useParams();
    const isCurrent = (currentUser?.name === username);
    const [rowSelected, setRowSelected] = useState({});
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const apiData = useSuspenseQuery(allUpdatesOptions(username, filters)).data;
    const paginationState = { pageIndex: filters?.pageIndex ?? 0, pageSize: filters?.pageSize ?? 25 };
    // const deleteMutation = useDeleteUpdateMutation(queryKeys.allUpdatesKey(username, filters));

    const setFilters = async (filtersData: Record<string, any>) => {
        //@ts-expect-error
        await navigate({ search: (prev) => ({ ...prev, ...filtersData }), resetScroll: false });
    };

    const resetFilters = async () => {
        //@ts-expect-error
        await navigate({ search: {}, resetScroll: false });
        setCurrentSearch("");
    };

    const onPaginationChange = (paginateFunc: any) => {
        setFilters(paginateFunc(paginationState));
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
        state: {
            rowSelection: rowSelected,
            pagination: paginationState,
        },
    });

    const deleteSelectedRows = async () => {
        const selectedIds = Object.keys(rowSelected).map(key => table.getRow(key).original.id);
        // await deleteMutation.mutateAsync({ updateIds: selectedIds });
        setRowSelected({});
    };

    useDebounceCallback(currentSearch, 300, setFilters, { search: currentSearch, pageIndex: 0 });

    return (
        <PageTitle title="History" subtitle="History of all my media updates">
            <div className="w-[900px] mx-auto mt-3">
                <div className="flex justify-between items-center pb-3">
                    <div className="flex items-center gap-2">
                        <Input
                            className="w-56"
                            value={currentSearch}
                            placeholder="Search by name..."
                            // disabled={deleteMutation.isPending}
                            onChange={(ev) => setCurrentSearch(ev.target.value)}
                        />
                        {/*{currentSearch &&*/}
                        {/*    <Button size="sm" onClick={resetFilters} disabled={deleteMutation.isPending}>*/}
                        {/*        Cancel*/}
                        {/*    </Button>*/}
                        {/*}*/}
                    </div>
                    {/*{isCurrent &&*/}
                    {/*    <Button disabled={Object.keys(rowSelected).length === 0 || deleteMutation.isPending} onClick={deleteSelectedRows}>*/}
                    {/*        Delete Selected*/}
                    {/*    </Button>*/}
                    {/*}*/}
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
                                        <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}
                                            // className={(deleteMutation.isPending && row.getIsSelected()) ? "opacity-50" : ""}
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
