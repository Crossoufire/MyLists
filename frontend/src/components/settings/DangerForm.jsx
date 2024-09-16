import {toast} from "sonner";
import {useAuth} from "@/hooks/AuthHook";
import {Button} from "@/components/ui/button";
import {useNavigate} from "@tanstack/react-router";
import {simpleMutations} from "@/api/mutations/simpleMutations";


export const DangerForm = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { deleteAccount } = simpleMutations();

    const onSubmit = async () => {
        if (!window.confirm("Are you really sure?")) return;

        deleteAccount.mutate(undefined, {
            onError: () => toast.error("An error occurred while deleting your account"),
            onSuccess: async () => {
                logout.mutate();
                toast.success("Your account has been successfully deleted");
                return navigate({ to: "/" });
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
