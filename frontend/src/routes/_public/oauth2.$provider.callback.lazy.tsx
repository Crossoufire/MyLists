import {toast} from "sonner";
import {useEffect} from "react";
import {useAuth} from "@/hooks/AuthHook";
import {createLazyFileRoute, useNavigate} from "@tanstack/react-router";


export const Route = createLazyFileRoute("/_public/oauth2/$provider/callback")({
    component: OAuth2CallbackPage,
});


function OAuth2CallbackPage() {
    const navigate = useNavigate();
    const search = Route.useSearch();
    const {currentUser, oAuth2Login} = useAuth();
    const {provider} = Route.useParams<{ provider: "github" | "google" }>();

    const authUsingOAuth2 = async () => {
        const data = {
            code: search?.code,
            state: search?.state,
            callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
        };

        oAuth2Login.mutate({provider, data}, {
            onError: async () => {
                toast.error("Failed to authenticate with the provider");
                await navigate({to: "/"});
            },
        });
    };

    useEffect(() => {
        void authUsingOAuth2();
    }, []);

    useEffect(() => {
        (async () => {
            if (!currentUser) return;
            await navigate({to: `/profile/${currentUser.username}`});
        })();
    }, [currentUser]);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Authentication in progress...</div>
        </div>
    );
}