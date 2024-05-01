import {toast} from "sonner";
import {useEffect} from "react";
import {useUser} from "@/providers/UserProvider";
import {Loading} from "@/components/app/base/Loading";
import {useNavigate, useParams, useSearchParams} from "react-router-dom";


export const OAuth2CallbackPage = () => {
    const { provider } = useParams();
    const { login, currentUser } = useUser();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        (async () => {
            const oauth2Data = {
                ...Object.fromEntries(searchParams),
                callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
            };

            const response = await login(provider, oauth2Data, true);

            if (!response.ok) {
                toast.error(response.body.description);
                return navigate("/", { replace: true });
            }

            navigate(`/profile/${currentUser.username}`, { replace: true });
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div className="flex flex-col justify-center items-center h-[calc(100vh_-_64px_-290px)]">
            <div className="text-xl mb-2 font-semibold">Authentication in progress</div>
            <Loading forPage={false}/>
        </div>
    )
};
