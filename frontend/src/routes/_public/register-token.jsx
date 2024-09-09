import {toast} from "sonner";
import {useEffect} from "react";
import {genericMutations} from "@/api/mutations.js";
import {createFileRoute, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/register-token")({
    component: RegisterTokenPage,
});


function RegisterTokenPage() {
    const navigate = useNavigate();
    const { token } = Route.useSearch();
    const { registerToken } = genericMutations();

    const registerHandler = () => {
        registerToken.mutate({ token }, {
            onError: () => toast.error("An error occurred during registration"),
            onSuccess: async () => {
                toast.success("Your account has been successfully activated. Feel free to log in now.");
                await navigate({ to: "/" });
            }
        });
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
