import {toast} from "sonner";
import {router} from "@/router";
import {Button} from "@/components/ui/button";
import {useAuth, useSimpleMutations} from "@/api";
import {useNavigate} from "@tanstack/react-router";


export const DangerForm = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { deleteAccount } = useSimpleMutations();

    const onSubmit = async () => {
        if (!window.confirm("Are you really sure?")) return;

        deleteAccount.mutate(undefined, {
            onError: () => toast.error("An error occurred while deleting your account"),
            onSuccess: async () => {
                logout.mutate(undefined, {
                    onSuccess: async () => {
                        await router.invalidate().then(() => {
                            navigate({ to: "/" });
                        });
                    },
                });
                toast.success("Your account has been successfully deleted");
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="max-w-[500px]">
                WARNING: Deleting your account is irreversible and will permanently
                remove all your data and access. Are you sure you want to proceed?
            </div>
            <Button variant="destructive" onClick={onSubmit} className="w-48" disabled={deleteAccount.isPending}>
                DELETE MY ACCOUNT
            </Button>
        </div>
    );
};
