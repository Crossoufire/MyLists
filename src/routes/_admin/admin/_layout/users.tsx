import {useMemo, useState} from "react";
import {Input} from "@/lib/components/ui/input";
import {Badge} from "@/lib/components/ui/badge";
import {Button} from "@/lib/components/ui/button";
import {formatDateTime} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {useDebounceCallback} from "@/lib/hooks/use-debounce";
import {PrivacyType, RoleType} from "@/lib/server/utils/enums";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {TablePagination} from "@/lib/components/app/TablePagination";
import {DashboardShell} from "@/lib/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/DashboardHeader";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/components/ui/avatar";
import {ColumnDef, flexRender, getCoreRowModel, useReactTable} from "@tanstack/react-table";
import {useAdminUpdateUserMutation} from "@/lib/react-query/query-mutations/admin.mutations";
import {adminQueryKeys, userAdminOptions} from "@/lib/react-query/query-options/admin-options";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";
import {CheckCircle, ChevronsUpDown, MoreHorizontal, Search, Trash2, UserCheck, UserX, X} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";


export const Route = createFileRoute("/_admin/admin/_layout/users")({
    validateSearch: (search) => search as Record<string, any>,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(userAdminOptions(search));
    },
    component: UserManagementPage,
})


function UserManagementPage() {
    const navigate = useNavigate();
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(userAdminOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const updateUserMutation = useAdminUpdateUserMutation(adminQueryKeys.adminUsersKeys(filters));
    const paginationState = { pageIndex: filters?.pageIndex ?? 0, pageSize: filters?.pageSize ?? 25 };
    const sortingState = [{ id: filters?.sortBy ?? "updatedAt", desc: filters?.sortDesc === "true" }];

    const setFilters = async (filtersData: Record<string, any>) => {
        //@ts-expect-error
        await navigate({ search: (prev) => ({ ...prev, ...filtersData }), replace: true });
    };

    const resetFilters = async () => {
        //@ts-expect-error
        await navigate({ search: { sortBy: filters?.sortBy, sortDesc: filters?.sortDesc } });
        setCurrentSearch("");
    };

    const onPaginationChange = (updater: any) => {
        setFilters(updater(paginationState));
    };

    const onSortingChange = (updater: any) => {
        const newState = updater(sortingState);
        console.log({ newState });
        setFilters({ sortBy: newState[0]?.id ?? "updatedAt", sortDesc: newState[0]?.desc ?? true, pageIndex: 0 });
    };

    const updateUser = (userId: number | undefined, payload: Record<string, any>) => {
        if (payload.delete && !window.confirm("Are you sure you want to delete this user?")) return;
        updateUserMutation.mutate({ userId, payload });
    };

    const usersColumns: ColumnDef<typeof apiData.items[0]>[] = useMemo(() => [
        {
            accessorKey: "name",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Username <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                return (
                    <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                            <AvatarImage alt={original.name} src={original.image!}/>
                            <AvatarFallback>{original.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div>
                            <div>{original.name}</div>
                            <p className="text-sm text-gray-500">{original.email}</p>
                        </div>
                    </div>
                );
            },
        },
        {
            accessorKey: "createdAt",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Registered <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                return formatDateTime(original.createdAt);
            }
        },
        {
            accessorKey: "updatedAt",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Last Seen <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                return formatDateTime(original.updatedAt, { includeTime: true });
            },
        },
        {
            accessorKey: "privacy",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Privacy <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                switch (original.privacy) {
                    case PrivacyType.PUBLIC:
                        return <Badge variant="outline" className="text-green-600">Public</Badge>
                    case PrivacyType.RESTRICTED:
                        return <Badge variant="outline" className="text-yellow-600">Restricted</Badge>
                    case PrivacyType.PRIVATE:
                        return <Badge variant="outline" className="text-red-600">Private</Badge>
                }
            },
        },
        {
            accessorKey: "showUpdateModal",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Features <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                return original.showUpdateModal ?
                    <Badge variant="outline" className="text-green-600">Enabled</Badge>
                    :
                    <Badge variant="outline" className="text-red-600">Disabled</Badge>
            },
        },
        {
            accessorKey: "role",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Role <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                return original.role === RoleType.USER ?
                    <Badge variant="outline" className="text-green-600">User</Badge>
                    :
                    <Badge variant="outline" className="text-yellow-600">Manager</Badge>
            },
        },
        {
            id: "actions",
            header: "Actions",
            enableSorting: false,
            cell: ({ row: { original } }) => (
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4"/>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>
                            Actions for {" "}
                            <span className="text-yellow-500">{original.name}</span>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem onClick={() => updateUser(original.id, { active: !original.emailVerified })}>
                            {original.emailVerified ? (
                                <>
                                    <UserX className="mr-2 h-4 w-4"/>
                                    <span>Disable account</span>
                                </>
                            ) : (
                                <>
                                    <UserCheck className="mr-2 h-4 w-4"/>
                                    <span>Enable account</span>
                                </>
                            )}
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuLabel>Privacy Settings</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                            checked={original.privacy === PrivacyType.PUBLIC}
                            onCheckedChange={() => updateUser(original.id, { privacy: PrivacyType.PUBLIC })}
                        >
                            Public
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={original.privacy === PrivacyType.RESTRICTED}
                            onCheckedChange={() => updateUser(original.id, { privacy: PrivacyType.RESTRICTED })}
                        >
                            Restricted
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={original.privacy === PrivacyType.PRIVATE}
                            onCheckedChange={() => updateUser(original.id, { privacy: PrivacyType.PRIVATE })}
                        >
                            Private
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuLabel>Role Settings</DropdownMenuLabel>
                        <DropdownMenuCheckboxItem
                            checked={original.role === RoleType.USER}
                            onCheckedChange={() => updateUser(original.id, { role: RoleType.USER })}
                        >
                            User
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuCheckboxItem
                            checked={original.role === RoleType.MANAGER}
                            onCheckedChange={() => updateUser(original.id, { role: RoleType.MANAGER })}
                        >
                            Manager
                        </DropdownMenuCheckboxItem>
                        <DropdownMenuSeparator/>
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onSelect={() => updateUser(original.id, { delete: true })}
                        >
                            <Trash2 className="mr-2 h-4 w-4"/>
                            <span>Delete user</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            ),
        }
    ], []);

    const table = useReactTable({
        enableSorting: true,
        manualSorting: true,
        columns: usersColumns,
        manualFiltering: true,
        manualPagination: true,
        data: apiData?.items ?? [],
        rowCount: apiData?.total ?? 0,
        onSortingChange: onSortingChange,
        getCoreRowModel: getCoreRowModel(),
        onPaginationChange: onPaginationChange,
        state: { pagination: paginationState, sorting: sortingState },
    });

    useDebounceCallback(currentSearch, 300, setFilters, { ...filters, search: currentSearch, pageIndex: 0 });

    return (
        <DashboardShell>
            <DashboardHeader heading="User Management" description="View and manage all users on your platform."/>
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
                <Button variant="outline" onClick={() => updateUser(undefined, { showUpdateModal: true })}>
                    <CheckCircle className="h-4 w-4 mr-2"/> Activate FeaturesFlag
                </Button>
            </div>
            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map(header =>
                                    <TableHead key={header.id}>
                                        {!header.isPlaceholder && flexRender(header.column.columnDef.header, header.getContext())}
                                    </TableHead>
                                )}
                            </TableRow>
                        ))}
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
                                <TableCell colSpan={usersColumns.length} className="h-24 text-center">
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
