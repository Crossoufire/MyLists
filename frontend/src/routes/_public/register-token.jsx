import {useEffect} from "react";
import {createFileRoute} from "@tanstack/react-router";
import {useRegisterTokenMutation} from "@/utils/mutations";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/register-token")({
    component: RegisterTokenPage,
});


function RegisterTokenPage() {
    const { token } = Route.useSearch();
    const registerTokenMutation = useRegisterTokenMutation();

    useEffect(() => {
        const registrationTimeout = setTimeout(() => {
            registerTokenMutation.mutate({ token: token });
        }, 700);
        return () => clearTimeout(registrationTimeout);
    }, [token, registerTokenMutation]);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Registration In Progress...</div>
        </div>
    );
}
