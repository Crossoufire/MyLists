import {toast} from "sonner";
import {useEffect} from "react";
import {useApi} from "@/providers/ApiProvider";
import {useNavigate, useSearchParams} from "react-router-dom";


export const RegisterTokenPage = () => {
    const api = useApi();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    useEffect(() => {
        (async () => {
            const response = await api.post("/tokens/register_token", {
                token: token,
            });

            if (!response.ok) {
                toast.error(response.body.description);
            }

            navigate("/");
        })();

        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);
};
