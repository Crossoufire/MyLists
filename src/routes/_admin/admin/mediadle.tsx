import {Search} from "lucide-react";
import {useMemo, useState} from "react";
import {Input} from "@/lib/client/components/ui/input";
import {formatDateTime} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {SearchType} from "@/lib/types/zod.schema.types";
import {createFileRoute, Link} from "@tanstack/react-router";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {TablePagination} from "@/lib/client/components/general/TablePagination";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/client/components/ui/avatar";
import {adminMediadleOptions} from "@/lib/client/react-query/query-options/admin-options";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/client/components/ui/table";
import {ColumnDef, flexRender, getCoreRowModel, OnChangeFn, PaginationState, useReactTable} from "@tanstack/react-table";


export const Route = createFileRoute("/_admin/admin/mediadle")({
    validateSearch: (search) => search as SearchType,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, deps: { search } }) => queryClient.ensureQueryData(adminMediadleOptions(search)),
    component: AdminMediadlePage,
})


const DEFAULT = { search: "", page: 1 } satisfies SearchType;


function AdminMediadlePage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const { search = DEFAULT.search } = filters;
    const apiData = useSuspenseQuery(adminMediadleOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const paginationState = { pageIndex: filters?.page ? (filters.page - 1) : 0, pageSize: 25 };

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

    const mediadleColumns = useMemo((): ColumnDef<typeof apiData.items[0]>[] => [
        {
            accessorKey: "name",
            header: "Username",
            cell: ({ row: { original } }) => {
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage alt={original.name} src={original.image!}/>
                            <AvatarFallback>{original.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <Link to="/profile/$username" params={{ username: original.name }} className="hover:underline hover:underline-offset-2">
                                {original.name}
                            </Link>
                            <p className="text-sm text-gray-500">
                                {original.email}
                            </p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: "Registered",
            cell: ({ row: { original } }) => {
                return formatDateTime(original.createdAt);
            }
        },
        {
            accessorKey: "updatedAt",
            header: "Last Seen",
            cell: ({ row: { original } }) => {
                return formatDateTime(original.updatedAt);
            },
        },
        {
            accessorKey: "averageAttempts",
            header: "Avg. Attempts",
            cell: ({ row: { original } }) => (
                <div className="text-center">
                    {original?.averageAttempts?.toFixed(1)}
                </div>
            ),
        },
        {
            accessorKey: "streak",
            header: "Steak",
            cell: ({ row: { original } }) => (
                <div className="text-center">{original.streak}</div>
            ),
        },
        {
            accessorKey: "bestStreak",
            header: "Best Streak",
            cell: ({ row: { original } }) => (
                <div className="text-center">{original.bestStreak}</div>
            ),
        },
        {
            accessorKey: "totalPlayed",
            header: "Total Played",
            cell: ({ row: { original } }) => (
                <div className="text-center">{original.totalPlayed}</div>
            ),
        },
        {
            accessorKey: "totalWon",
            header: "Total Won",
            cell: ({ row: { original } }) => (
                <div className="text-center">
                    {original.totalWon}
                </div>
            ),
        },
    ], []);

    const table = useReactTable({
        manualFiltering: true,
        manualPagination: true,
        columns: mediadleColumns,
        data: apiData?.items ?? [],
        rowCount: apiData?.total ?? 0,
        getCoreRowModel: getCoreRowModel(),
        onPaginationChange: onPaginationChange,
        state: { pagination: paginationState },
    });

    useDebounceCallback(currentSearch, 300, () => fetchData({ search: currentSearch, page: 1 }));

    return (
        <DashboardShell>
            <DashboardHeader
                heading="Mediadle Stats"
                description="View all users moviedle stats."
            />
            <div className="flex items-center justify-between mb-3 max-sm:flex-col max-sm:items-start max-sm:justify-center">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
                    <Input
                        type="search"
                        value={currentSearch}
                        className="pl-8 w-64"
                        onChange={onSearchChange}
                        placeholder="Search by name..."
                    />
                </div>
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
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
                                <TableCell colSpan={mediadleColumns.length} className="h-24 text-center">
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
        </DashboardShell>
    );
}
