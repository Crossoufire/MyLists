import {toast} from "sonner";
import {useEffect} from "react";
import {api} from "@/api/MyApiClient";
import {createFileRoute, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/register_token")({
    component: RegisterTokenPage,
});


function RegisterTokenPage() {
    const navigate = useNavigate();
    const { token } = Route.useSearch();

    useEffect(() => {
        const registrationTimeout = setTimeout(async () => {
            const response = await api.post("/tokens/register_token", { token: token });

            if (!response.ok) {
                toast.error(response.body.description);
            } else {
                toast.success("Your account has been successfully activated. Feel free to log-in now.");
            }

            return navigate({ to: "/" });
        }, 700);

        return () => clearTimeout(registrationTimeout);
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Registration In Progress...</div>
        </div>
    );
}
