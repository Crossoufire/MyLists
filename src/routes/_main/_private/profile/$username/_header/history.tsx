import React, {useState} from "react";
import {Search} from "lucide-react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {formatDateTime} from "@/lib/utils/functions";
import {Input} from "@/lib/client/components/ui/input";
import {useSuspenseQuery} from "@tanstack/react-query";
import {SearchType} from "@/lib/types/zod.schema.types";
import {Button} from "@/lib/client/components/ui/button";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {createFileRoute, Link} from "@tanstack/react-router";
import {Payload} from "@/lib/client/components/general/Payload";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";
import {TablePagination} from "@/lib/client/components/general/TablePagination";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {allUpdatesOptions} from "@/lib/client/react-query/query-options/query-options";
import {useDeleteAllUpdatesMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/client/components/ui/table";
import {ColumnDef, flexRender, getCoreRowModel, OnChangeFn, PaginationState, useReactTable} from "@tanstack/react-table";


export const Route = createFileRoute("/_main/_private/profile/$username/_header/history")({
    validateSearch: (search) => search as SearchType,
    loaderDeps: ({ search }) => ({ search }),
    loader: ({ context: { queryClient }, params: { username }, deps: { search } }) => {
        return queryClient.ensureQueryData(allUpdatesOptions(username, search));
    },
    component: AllUpdates,
});


const DEFAULT = { search: "", page: 1 } satisfies SearchType;


const getHistoryColumns = (isCurrent: boolean): ColumnDef<any>[] => {
    return [
        {
            id: "select",
            header: ({ table }) => (
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
            cell: ({ row }) => (
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
            cell: ({ row: { original } }) => {
                return (
                    <div className="flex items-center gap-4">
                        <MediaAndUserIcon type={original.mediaType} size={16}/>
                        <Link
                            search={{ external: false }}
                            to="/details/$mediaType/$mediaId"
                            params={{ mediaType: original.mediaType, mediaId: original.mediaId }}
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
            cell: ({ row }) => formatDateTime(row.original.timestamp),
        },
    ]
}


function AllUpdates() {
    const { currentUser } = useAuth();
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { username } = Route.useParams();
    const isCurrent = (currentUser?.name === username);
    const [rowSelected, setRowSelected] = useState({});
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const deleteUpdateMutation = useDeleteAllUpdatesMutation(username, filters);
    const apiData = useSuspenseQuery(allUpdatesOptions(username, filters)).data;
    const paginationState = { pageIndex: filters?.page ? (filters.page - 1) : 0, pageSize: 25 };

    const { search = DEFAULT.search } = filters;
    const historyColumns = getHistoryColumns(isCurrent);

    const fetchData = async (filtersData: SearchType) => {
        await navigate({ search: filtersData, resetScroll: false });
    };

    const onSearchChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = ev.target.value;
        setCurrentSearch(value);
        if (value === "") {
            await fetchData({});
            setCurrentSearch(DEFAULT.search);
        }
    }

    const onPaginationChange: OnChangeFn<PaginationState> = async (updaterOrValue) => {
        const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(paginationState) : updaterOrValue;
        await fetchData({ search: search, page: newPagination.pageIndex + 1 });
    };

    const deleteSelectedRows = async () => {
        const selectedIds = Object.keys(rowSelected).map((key) => table.getRow(key).original.id);
        await deleteUpdateMutation.mutateAsync({ data: { updateIds: selectedIds } });
        setRowSelected({});
    };

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

    useDebounceCallback(currentSearch, 300, () => fetchData({ search: currentSearch, page: 1 }));

    return (
        <PageTitle title="History" subtitle="History of all media updates">
            <div className="w-full max-w-screen-lg mx-auto mt-4">
                <div className="flex justify-between items-center pb-3">
                    <div className="flex items-center gap-2">
                        <div className="relative">
                            <Search size={15} className="absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground"/>
                            <Input
                                type="search"
                                value={currentSearch}
                                onChange={onSearchChange}
                                className="pl-8 w-56 text-sm"
                                placeholder="Search by name..."
                                disabled={deleteUpdateMutation.isPending}
                            />
                        </div>
                    </div>
                    {(isCurrent && Object.keys(rowSelected).length !== 0) &&
                        <Button disabled={Object.keys(rowSelected).length === 0 || deleteUpdateMutation.isPending} onClick={deleteSelectedRows}>
                            Delete Selected
                        </Button>
                    }
                </div>
                <div className="rounded-md border p-3 pt-0 overflow-x-auto">
                    <Table>
                        <TableHeader>
                            {table.getHeaderGroups().map((headerGroup) =>
                                <TableRow key={headerGroup.id}>
                                    {headerGroup.headers.map((header) =>
                                        <TableHead key={header.id}>
                                            {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                        </TableHead>
                                    )}
                                </TableRow>
                            )}
                        </TableHeader>
                        <TableBody>
                            {table.getRowModel().rows?.length ?
                                table.getRowModel().rows.map((row) => {
                                    return (
                                        <TableRow
                                            key={row.id}
                                            data-state={row.getIsSelected() && "selected"}
                                            className={(deleteUpdateMutation.isPending && row.getIsSelected()) ? "opacity-50" : ""}
                                        >
                                            {row.getVisibleCells().map((cell) =>
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
                    <TablePagination
                        table={table}
                    />
                </div>
            </div>
        </PageTitle>
    );
}
