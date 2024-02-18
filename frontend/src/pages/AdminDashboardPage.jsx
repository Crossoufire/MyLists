import {toast} from "sonner";
import {Fragment} from "react";
import {formatDate} from "@/lib/utils";
import {ErrorPage} from "@/pages/ErrorPage";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {useFetchData} from "@/hooks/FetchDataHook";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {useAdminApi} from "@/hooks/AdminUpdaterHook";
import {Loading} from "@/components/primitives/Loading";
import {Select, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


const PopulateUsers = ({ users }) => {
    const navigate = useNavigate();
    const allRoles = ["user", "manager"];
    const { role, deletion } = useAdminApi();

    const updateRole = async (ev, userId) => {
        ev.preventDefault();
        await role(userId, ev.target.value);
    }

    const deleteAccount = async (userId, username) => {
        const firstConfirm = window.confirm(`Are you absolutely certain you want to delete the account to ${username}?`);

        if (firstConfirm) {
            const secondConfirm = window.confirm("This action is irreversible. Are you ABSOLUTELY certain?");

            if (secondConfirm) {
                await deletion(userId);
                navigate(0);
            }
        }
    }

    return (
        <div className="mt-4">
            <div className="grid grid-cols-12 font-medium gap-3 text-center">
                <div className="col-span-3">USERNAME</div>
                <div className="col-span-2">NOTIFICATION</div>
                <div className="col-span-2">PROFILE LEVEL</div>
                <div className="col-span-2">ROLE</div>
                <div className="col-span-3">DELETE ACCOUNT</div>
                <Separator/>
                {users.map(user =>
                    <Fragment key={user.id}>
                        <div className="col-span-3">{user.username}</div>
                        <div className="col-span-2">{formatDate(user.notif)}</div>
                        <div className="col-span-2">{user.level}</div>
                        <div className="col-span-2">
                            <Select onChange={(ev) => updateRole(ev, user.id)} defaultValue={user.role}>
                                <SelectTrigger>
                                    <SelectValue/>
                                </SelectTrigger>
                                {allRoles.map(role =>
                                    <SelectItem key={role} value={role}>{role}</SelectItem>
                                )}
                            </Select>
                        </div>
                        <div className="col-span-3">
                            <Button variant="deconstructive" onClick={() => deleteAccount(user.id, user.username)}>
                                Delete
                            </Button>
                        </div>
                    </Fragment>
                )}
            </div>
        </div>
    );
};


export const AdminDashboardPage = () => {
    const navigate = useNavigate();
    const {apiData, loading, error} = useFetchData("/admin/dashboard");

    if (error?.status === 403) {
        toast.error("Your authorization has expired. Please reconnect.")
        return navigate("/admin");
    }

    if (error) return <ErrorPage error={error}/>;
    if (loading) return <Loading/>;

    return (
        <PageTitle title="Admin Dashboard" subtitle="Here you can change users role and remove accounts">
            <PopulateUsers users={apiData}/>
        </PageTitle>
    );
};
