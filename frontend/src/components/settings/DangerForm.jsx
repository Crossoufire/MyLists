import {toast} from "sonner";
import {useState} from "react";
import {Button} from "@/components/ui/button";
import {api, userClient} from "@/api/MyApiClient";
import {useNavigate} from "@tanstack/react-router";
import {FormError} from "@/components/app/base/FormError";


export const DangerForm = () => {
    const navigate = useNavigate();
    const [errors, setErrors] = useState("");
    const [pending, setPending] = useState(false);

    const deleteAccount = async () => {
        setErrors("");
        const confirm = window.confirm("Are you really sure?");

        if (confirm) {
            setPending(true);
            const response = await api.post("/settings/delete_account");
            setPending(false);

            if (!response.ok) {
                return setErrors(response.body.description);
            }

            toast.success("Your account has been successfully deleted");
            await userClient.logout();
            return navigate({ to: "/" });
        }
    };

    return (
        <div className="space-y-6">
            <div>
                WARNING: Deleting your account is irreversible and will permanently remove all your data and access. Are
                you sure you want to proceed?
            </div>
            <Button variant="destructive" onClick={deleteAccount} className="w-48" disabled={pending}>
                DELETE MY ACCOUNT
            </Button>
            {errors && <FormError message={errors}/>}
        </div>
    );
};
