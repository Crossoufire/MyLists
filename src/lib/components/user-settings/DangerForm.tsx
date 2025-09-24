import {toast} from "sonner";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {useQueryClient} from "@tanstack/react-query";
import {useNavigate, useRouter} from "@tanstack/react-router";
import {authOptions} from "@/lib/react-query/query-options/query-options";
import {useDeleteAccountMutation} from "@/lib/react-query/query-mutations/user.mutations";


export const DangerForm = () => {
    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const deleteAccountMutation = useDeleteAccountMutation();

    const onSubmit = async () => {
        const firstConfirm = window.confirm("Are you sure?");
        if (!firstConfirm) return;

        const secondConfirm = window.confirm("All your data will be permanently deleted. Are you really sure?");
        if (!secondConfirm) return;

        deleteAccountMutation.mutate(undefined, {
            onError: () => toast.error("An error occurred while deleting your account. Please try again later."),
            onSuccess: async () => {
                await authClient.signOut();
                await router.invalidate();
                queryClient.setQueryData(authOptions.queryKey, null);
                await navigate({ to: "/", replace: true });
                queryClient.removeQueries();
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
            <Button variant="destructive" onClick={onSubmit} className="w-48">
                DELETE MY ACCOUNT
            </Button>
        </div>
    );
};
