import {createFileRoute} from "@tanstack/react-router";
import {UsersTable} from "@/lib/components/admin/users/UserTable";
import {UserFilters} from "@/lib/components/admin/users/UserFilters";
import {DashboardShell} from "@/lib/components/admin/dashboard/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/dashboard/DashboardHeader";
import {getAdminAllUsers, postAdminUpdateUser} from "@/lib/server/functions/admin";
import {queryOptions, useMutation, useQueryClient, useSuspenseQuery} from "@tanstack/react-query";


type AdminQueryKeyFunction<T extends any[]> = (...args: T) => (string | any)[];


type AdminQueryKeys = {
    updateUsersKey: AdminQueryKeyFunction<[Record<string, any>]>;
};


export const adminQueryKeys: AdminQueryKeys = {
    updateUsersKey: (search) => ["updateUsers", search],
};


const userAdminOptions = (search: Record<string, any>) => queryOptions({
    queryKey: adminQueryKeys.updateUsersKey(search),
    queryFn: () => getAdminAllUsers({ data: search }),
});


export const Route = createFileRoute("/_admin/admin/_layout/users")({
    validateSearch: (search) => search as Record<string, any>,
    loaderDeps: ({ search }) => ({ search }),
    loader: async ({ context: { queryClient }, deps: { search } }) => {
        return queryClient.ensureQueryData(userAdminOptions(search));
    },
    component: DashboardUsers,
})


function DashboardUsers() {
    const filters = Route.useSearch();
    const apiData = useSuspenseQuery(userAdminOptions(filters)).data;
    const updateUserMutation = useAdminUpdateUserMutation(adminQueryKeys.updateUsersKey(filters));

    return (
        <DashboardShell>
            <DashboardHeader heading="User Management" description="View and manage all users on your platform."/>
            <UserFilters/>
            <UsersTable
                paginatedUsers={apiData}
                updateUser={updateUserMutation}
            />
        </DashboardShell>
    )
}


export const useAdminUpdateUserMutation = (queryKey: string[]) => {
    const queryClient = useQueryClient();

    return useMutation<any, Error, { userId: number, payload: Record<string, any> }>({
        mutationFn: ({ userId, payload }) => postAdminUpdateUser({ data: { userId, payload } }),
        onSuccess: async () => await queryClient.invalidateQueries({ queryKey }),
    });
};
