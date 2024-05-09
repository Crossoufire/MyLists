import {toast} from "sonner";
import {useEffect} from "react";
import {userClient} from "@/api/MyApiClient";
import {createFileRoute, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/oauth2/$provider/callback")({
    component: OAuth2CallbackPage,
});


function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const { provider } = Route.useParams();
    const searchParams = Route.useSearch();

    useEffect(() => {
        (async () => {
            const oauth2Data = {
                ...searchParams,
                callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
            };

            const response = await userClient.login(provider, oauth2Data, true);

            if (!response.ok) {
                toast.error(response.body.description);
                return navigate({ to: "/" });
            }

            return navigate({ to: `/profile/${userClient.currentUser.username}` });
        })();
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Authentication in progress...</div>
        </div>
    )
}