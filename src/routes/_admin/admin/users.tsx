import {Input} from "@/lib/client/components/ui/input";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {useCallback, useMemo, useState} from "react";
import {formatDateTime} from "@/lib/utils/functions";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute, Link} from "@tanstack/react-router";
import {useDebounceCallback} from "@/lib/client/hooks/use-debounce";
import {PrivacyType, RoleType} from "@/lib/utils/enums";
import {DashboardShell} from "@/lib/client/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/client/components/admin/DashboardHeader";
import {TablePagination} from "@/lib/client/components/general/TablePagination";
import {userAdminOptions} from "@/lib/client/react-query/query-options/admin-options";
import {AdminUpdatePayload, SearchTypeAdmin} from "@/lib/types/zod.schema.types";
import {useAdminUpdateUserMutation} from "@/lib/client/react-query/query-mutations/admin.mutations";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/client/components/ui/table";
import {CheckCircle, ChevronsUpDown, MoreHorizontal, Search, Trash2, UserCheck, UserX} from "lucide-react";
import {ColumnDef, flexRender, getCoreRowModel, OnChangeFn, PaginationState, SortingState, useReactTable} from "@tanstack/react-table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/lib/client/components/ui/dropdown-menu";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";


export const Route = createFileRoute("/_admin/admin/users")({
    validateSearch: (search) => search as SearchTypeAdmin,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, deps: { search } }) => queryClient.ensureQueryData(userAdminOptions(search)),
    component: UserManagementPage,
})


function UserManagementPage() {
    const filters = Route.useSearch();
    const navigate = Route.useNavigate();
    const updateUserMutation = useAdminUpdateUserMutation(filters);
    const apiData = useSuspenseQuery(userAdminOptions(filters)).data;
    const [currentSearch, setCurrentSearch] = useState(filters?.search ?? "");
    const paginationState = { pageIndex: filters?.page ? (filters.page - 1) : 0, pageSize: 25 };
    const sortingState = [{ id: filters?.sorting ?? "updatedAt", desc: filters?.sortDesc === true }];

    const setFilters = async (filtersData: SearchTypeAdmin) => {
        await navigate({ search: (prev) => ({ ...prev, ...filtersData }), replace: true });
    };

    const onSearchChange = async (ev: React.ChangeEvent<HTMLInputElement>) => {
        const value = ev.target.value;
        setCurrentSearch(value);
        if (value === "") {
            setCurrentSearch("");
            await navigate({ search: { sorting: filters?.sorting, sortDesc: filters?.sortDesc } });
        }
    }

    const onPaginationChange: OnChangeFn<PaginationState> = async (updaterOrValue) => {
        const newPagination = typeof updaterOrValue === "function" ? updaterOrValue(paginationState) : updaterOrValue;
        await setFilters({ page: newPagination.pageIndex + 1 });
    };

    const onSortingChange: OnChangeFn<SortingState> = async (updaterOrValue) => {
        const newSorting = typeof updaterOrValue === "function" ? updaterOrValue(sortingState) : updaterOrValue;
        await setFilters({ sorting: newSorting[0]?.id ?? "updatedAt", sortDesc: newSorting[0]?.desc ?? true, page: 1 });
    };

    const updateUser = useCallback((userId: number | undefined, payload: AdminUpdatePayload) => {
        if (payload.deleteUser && !window.confirm("Are you sure you want to delete this user?")) return;
        updateUserMutation.mutate({ data: { userId, payload } });
    }, [updateUserMutation]);

    const usersColumns: ColumnDef<typeof apiData.items[0]>[] = useMemo(() => [
        {
            accessorKey: "id",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Id <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                );
            },
            cell: ({ row: { original } }) => <div>{original.id}</div>,
        },
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
                        <ProfileIcon
                            fallbackSize="text-sm"
                            className="size-9 border-2"
                            user={{ image: original.image, name: original.name }}
                        />
                        <div>
                            <div>
                                <Link to="/profile/$username" params={{ username: original.name }} className="hover:underline hover:underline-offset-2">
                                    {original.name}
                                </Link>
                            </div>
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
                return formatDateTime(original.createdAt, { noTime: true });
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
                return formatDateTime(original.updatedAt);
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
            accessorKey: "emailVerified",
            header: ({ column }) => {
                return (
                    <Button variant="invisible" size="xs" onClick={() => column.toggleSorting()}>
                        Active <ChevronsUpDown className="ml-1 h-4 w-4"/>
                    </Button>
                )
            },
            cell: ({ row: { original } }) => {
                return original.emailVerified ?
                    <Badge variant="outline" className="text-green-600">Yes</Badge>
                    :
                    <Badge variant="outline" className="text-red-600">No</Badge>
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
                        <DropdownMenuItem onClick={() => updateUser(original.id, { emailVerified: !original.emailVerified })}>
                            {original.emailVerified ?
                                <>
                                    <UserX className="mr-2 h-4 w-4"/>
                                    <span>Disable account</span>
                                </>
                                :
                                <>
                                    <UserCheck className="mr-2 h-4 w-4"/>
                                    <span>Enable account</span>
                                </>
                            }
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
                            onSelect={() => updateUser(original.id, { deleteUser: true })}
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

    useDebounceCallback(currentSearch, 300, () => setFilters({ ...filters, search: currentSearch, page: 1 }));

    return (
        <DashboardShell>
            <DashboardHeader
                heading="User Management"
                description="View and manage all users on your platform."
            />
            <div className="flex items-center justify-between mb-3 max-sm:flex-col max-sm:items-start max-sm:justify-center max-sm:gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 size-4 text-muted-foreground"/>
                    <Input
                        type="search"
                        value={currentSearch}
                        onChange={onSearchChange}
                        className="w-[250px] pl-8"
                        placeholder="Search users..."
                    />
                </div>
                <Button variant="outline" onClick={() => updateUser(undefined, { showUpdateModal: true })}>
                    <CheckCircle className="size-4"/> Activate Features Flag
                </Button>
            </div>
            <div className="rounded-md border p-3 pt-0 overflow-x-auto">
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
