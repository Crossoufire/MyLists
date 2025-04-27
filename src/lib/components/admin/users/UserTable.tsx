import {Button} from "@/lib/components/ui/button";
import {PrivacyType} from "@/lib/server/utils/enums";
import {capitalize, formatDateTime} from "@/lib/utils/functions";
import {useAdminUpdateUserMutation} from "@/routes/_admin/admin/_layout/users";
import {Avatar, AvatarFallback, AvatarImage} from "@/lib/components/ui/avatar";
import {ArrowUpDown, MoreHorizontal, Trash2, UserCheck, UserX} from "lucide-react";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/lib/components/ui/table";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/lib/components/ui/dropdown-menu";


interface UsersTableProps {
    paginatedUsers: any;
    updateUser: ReturnType<typeof useAdminUpdateUserMutation>;
}


// TODO implement mutations and use the table from history (with search, pagination, and multiple selection)

export function UsersTable({ paginatedUsers, updateUser }: UsersTableProps) {
    const updateUserPrivacy = (userId: number, privacy: PrivacyType) => {
        updateUser.mutate({ userId, payload: { privacy } });
    };

    const toggleActiveUser = (userId: number) => {
        const user = paginatedUsers.items.find((user: any) => user.id === userId);
        updateUser.mutate({ userId, payload: { emailVerified: !user.active } });
    };

    const deleteUser = (userId: number) => {
        if (!confirm("Are you sure you want to delete this user?")) return;
        updateUser.mutate({ userId, payload: { delete: true } });
    };

    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[250px]">
                            <Button variant="ghost" className="p-0 hover:bg-transparent">
                                <span>User</span>
                                <ArrowUpDown className="ml-2 h-4 w-4"/>
                            </Button>
                        </TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Last Active</TableHead>
                        <TableHead>Privacy</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {paginatedUsers.items.map((user: any) => (
                        <TableRow key={user.id}>
                            <TableCell className="font-medium">
                                <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage alt={user.name} src={user.image!}/>
                                        <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    {user.name}
                                </div>
                            </TableCell>
                            <TableCell>{user.email}</TableCell>
                            <TableCell>{formatDateTime(user.updatedAt, { includeTime: true })}</TableCell>
                            <TableCell>{capitalize(user.privacy)}</TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" className="h-8 w-8 p-0">
                                            <span className="sr-only">Open menu</span>
                                            <MoreHorizontal className="h-4 w-4"/>
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem onClick={() => toggleActiveUser(user.id)}>
                                            {user.active ? (
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
                                            checked={user.privacy === PrivacyType.PUBLIC}
                                            onCheckedChange={() => updateUserPrivacy(user.id, PrivacyType.PUBLIC)}
                                        >
                                            Public
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={user.privacy === PrivacyType.RESTRICTED}
                                            onCheckedChange={() => updateUserPrivacy(user.id, PrivacyType.RESTRICTED)}
                                        >
                                            Restricted
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuCheckboxItem
                                            checked={user.privacy === PrivacyType.PRIVATE}
                                            onCheckedChange={() => updateUserPrivacy(user.id, PrivacyType.PRIVATE)}
                                        >
                                            Private
                                        </DropdownMenuCheckboxItem>
                                        <DropdownMenuSeparator/>
                                        <DropdownMenuItem
                                            className="text-red-600 focus:text-red-600"
                                            onSelect={() => deleteUser(user.id)}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4"/>
                                            <span>Delete user</span>
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    )
}
