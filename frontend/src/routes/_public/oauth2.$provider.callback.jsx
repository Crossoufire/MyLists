import {toast} from "sonner";
import {useEffect} from "react";
import {useUser} from "@/providers/UserProvider";
import {createFileRoute, useNavigate, useRouter} from "@tanstack/react-router";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_public/oauth2/$provider/callback")({
    component: OAuth2CallbackPage,
});


function OAuth2CallbackPage() {
    const router = useRouter();
    const navigate = useNavigate();
    const { provider } = Route.useParams();
    const searchParams = Route.useSearch();
    const { currentUser, login } = useUser();

    useEffect(() => {
        (async () => {
            const oauth2Data = {
                ...searchParams,
                callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
            };

            const response = await login(provider, oauth2Data, true);

            if (!response.ok) {
                toast.error(response.body.description);
                return navigate({ to: "/" });
            }
        })();
    }, []);

    useEffect(() => {
        if (currentUser) {
            (async () => {
                await router.invalidate();
                await navigate({ to: `/profile/${currentUser.username}` });
            })();
        }
    }, [currentUser]);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Authentication in progress...</div>
        </div>
    )
}