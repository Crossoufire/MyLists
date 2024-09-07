import {toast} from "sonner";
import {useEffect} from "react";
import {authMutations} from "@/utils/mutations";
import {createFileRoute, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/register-token")({
    component: RegisterTokenPage,
});


function RegisterTokenPage() {
    const navigate = useNavigate();
    const { token } = Route.useSearch();
    const { registerToken } = authMutations(onSuccess, onError);

    function onError(_error) {
        toast.error("An error occurred during registration");
    }

    async function onSuccess() {
        toast.success("Your account has been successfully activated. Feel free to log in now.");
        await navigate({to: "/"});
    }

    const registerHandler = async () => {
        await registerToken.mutateAsync({ token });
    };

    useEffect(() => {
        const registrationTimeout = setTimeout(async () => {
            await registerHandler();
        }, 700);
        return () => clearTimeout(registrationTimeout);
    }, [token, registerHandler]);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Registration In Progress...</div>
        </div>
    );
}
