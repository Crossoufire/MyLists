import {Search, X} from "lucide-react";
import {useMemo, useState} from "react";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {formatDateTime} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {useDebounceCallback} from "@/lib/hooks/use-debounce";
import {DashboardShell} from "@/lib/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/DashboardHeader";
import {TablePagination} from "@/lib/components/general/TablePagination";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/components/ui/avatar";
import {adminMediadleOptions} from "@/lib/react-query/query-options/admin-options";
import {ColumnDef, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";


export const Route = createFileRoute("/_admin/admin/_layout/mediadle")({
    validateSearch: (search) => search as Record<string, any>,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(adminMediadleOptions(search));
    },
    component: AdminMediadlePage,
})


function AdminMediadlePage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const apiData = useSuspenseQuery(adminMediadleOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const paginationState = { pageIndex: filters?.pageIndex ?? 0, pageSize: filters?.pageSize ?? 25 };

    const setFilters = async (filtersData: Record<string, any>) => {
        await navigate({ search: (prev) => ({ ...prev, ...filtersData }), replace: true });
    };

    const resetFilters = async () => {
        await navigate({ search: {} });
        setCurrentSearch("");
    };

    const onPaginationChange = (updater: any) => {
        setFilters(updater(paginationState));
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
                            {original.name}
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
                return formatDateTime(original.updatedAt, { includeTime: true });
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
        state: { pagination: paginationState },
        onPaginationChange: onPaginationChange,
    });

    useDebounceCallback(currentSearch, 300, setFilters, { ...filters, search: currentSearch, pageIndex: 0 });

    return (
        <DashboardShell>
            <DashboardHeader heading="Mediadle Stats" description="View all users moviedle stats."/>
            <div className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex w-full max-w-sm items-center space-x-2">
                    <div className="relative w-full">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground"/>
                        <Input
                            type="search"
                            value={currentSearch}
                            className="w-full pl-8"
                            placeholder="Search users..."
                            onChange={(ev) => setCurrentSearch(ev.target.value)}
                        />
                        {currentSearch && (
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={resetFilters}
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                            >
                                <X className="h-4 w-4"/>
                                <span className="sr-only">Clear search</span>
                            </Button>
                        )}
                    </div>
                </div>
            </div>
            <div className="rounded-md border">
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
                            table.getRowModel().rows.map(row => {
                                return (
                                    <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
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
    )
}
