import {toast} from "sonner";
import {useEffect} from "react";
import {useUser} from "@/providers/UserProvider";
import {createFileRoute, useNavigate} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/oauth2/$provider/callback")({
    component: OAuth2CallbackPage,
});


function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const { provider } = Route.useParams();
    const { currentUser, oAuth2Login } = useUser();

    useEffect(() => {
        (async () => {
            const oauth2Data = {
                code: search?.code,
                state: search?.state,
                callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
            };
            const response = await oAuth2Login(provider, oauth2Data);
            if (!response.ok) {
                toast.error(response.body.description);
                await navigate({ to: "/" });
            }
        })();
    }, []);

    useEffect(() => {
        (async () => {
            if (!currentUser) return;
            await navigate({ to: `/profile/${currentUser.username}` });
        })();
    }, [currentUser]);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Authentication in progress...</div>
        </div>
    )
}