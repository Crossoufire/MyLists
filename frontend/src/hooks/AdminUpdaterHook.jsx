import {toast} from "sonner";
import {useApi} from "@/providers/ApiProvider";


export const useAdminApi = () => {
    const api = useApi();

    const makeUpdateFunction = (url) => async (user_id, payload = null) => {
        const response = await api.post(url, {
            user_id: user_id,
            payload: payload,
        });

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success(response.body.message);
    };

    const role = makeUpdateFunction("/admin/update_role");
    const deletion = makeUpdateFunction("/admin/delete_account");

    return { role, deletion };
};
