import {toast} from "sonner";
import {router} from "@/router";
import {Button} from "@/components/ui/button";
import {useNavigate} from "@tanstack/react-router";
import {queryClient, useAuth, useSimpleMutations} from "@/api";


export const DangerForm = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { deleteAccount } = useSimpleMutations();

    const onSubmit = async () => {
        const firstConfirm = window.confirm("Are you really sure?");
        if (!firstConfirm) return;

        const secondConfirm = window.confirm("All your data will be permanently deleted. Are you sure?");
        if (!secondConfirm) return;

        deleteAccount.mutate(undefined, {
            onError: () => toast.error("An error occurred while deleting your account. Please try again later."),
            onSuccess: async () => {
                logout.mutate(undefined, {
                    onSuccess: async () => {
                        queryClient.clear();
                        await router.invalidate().then(() => {
                            navigate({ to: "/" });
                        });
                    },
                });
                toast.success("Your account has been deleted successfully");
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
