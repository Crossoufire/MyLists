import {Fragment} from "react";
import {api} from "@/api/MyApiClient";
import {createLocalDate} from "@/lib/utils";
import {Button} from "@/components/ui/button";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {useAdminApi} from "@/hooks/AdminUpdaterHook";
import {createFileRoute, redirect, useNavigate} from "@tanstack/react-router";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/admin/dashboard")({
    component: AdminDashboardPage,
    loader: async () => {
        const response = await api.get("/admin/dashboard");

        // TODO: find a way to add the toast response (Authorization expired. You need to reconnect)
        if (response.status === 403) {
            return redirect({ to: "/admin" });
        }

        if (!response.ok) {
            throw new Error(
                JSON.stringify({
                    status: response.status,
                    message: response.body.message,
                    description: response.body.description,
                })
            );
        }

        return response.body.data;
    }
});


function AdminDashboardPage() {
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const { role, deletion } = useAdminApi();

    const updateRole = async (value, userId) => {
        await role(userId, value);
    };

    const deleteAccount = async (userId, username) => {
        const firstConfirm = window.confirm(`Are you absolutely sure you want to delete the account to ${username}?`);

        if (firstConfirm) {
            const secondConfirm = window.confirm("This action is irreversible. Are you ABSOLUTELY certain?");

            if (secondConfirm) {
                await deletion(userId);
                return navigate({ to: "/admin/dashboard" });
            }
        }
    };

    return (
        <PageTitle title="Admin Dashboard" subtitle="Here you can change users role and remove accounts">
            <PopulateUsers
                users={apiData}
                updateRole={updateRole}
                deleteAccount={deleteAccount}
            />
        </PageTitle>
    );
}


const PopulateUsers = ({ users, updateRole, deleteAccount }) => {
    const allRoles = ["user", "manager"];

    return (
        <div className="mt-4">
            <div className="grid grid-cols-12 font-medium gap-3 text-center">
                <div className="col-span-3">USERNAME</div>
                <div className="col-span-2">NOTIFICATION</div>
                <div className="col-span-2">PROFILE LEVEL</div>
                <div className="col-span-2">ROLE</div>
                <div className="col-span-3">DELETE ACCOUNT</div>
                <Separator className="col-span-12 mt-0 mb-0" variant="large"/>
                {users.map(user =>
                    <Fragment key={user.id}>
                        <div className="col-span-3">{user.username}</div>
                        <div className="col-span-2">{createLocalDate(user.notif, true)}</div>
                        <div className="col-span-2">{user.level}</div>
                        <div className="col-span-2">
                            <Select onValueChange={(value) => updateRole(value, user.id)} defaultValue={user.role}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                <SelectContent>
                                    {allRoles.map(role => <SelectItem key={role} value={role}>{role}</SelectItem>)}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="col-span-3">
                            <Button variant="destructive" onClick={() => deleteAccount(user.id, user.username)}>
                                Delete
                            </Button>
                        </div>
                    </Fragment>
                )}
            </div>
        </div>
    );
};
