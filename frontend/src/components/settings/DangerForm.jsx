import {toast} from "sonner";
import {useState} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {Button} from "@/components/ui/button";
import {genericMutations} from "@/api/mutations";
import {useNavigate} from "@tanstack/react-router";
import {FormError} from "@/components/app/base/FormError";


export const DangerForm = () => {
    const { logout } = useAuth();
    const navigate = useNavigate();
    const { deleteAccount } = genericMutations;
    const [errors, setErrors] = useState("");

    const onSubmit = async () => {
        setErrors("");
        if (!window.confirm("Are you really sure?")) return;

        deleteAccount.mutate({}, {
            onError: (error) => setErrors(error.description),
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
            {errors && <FormError message={errors}/>}
        </div>
    );
};
