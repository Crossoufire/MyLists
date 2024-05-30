import {toast} from "sonner";
import {api} from "@/api/MyApiClient";


export const useAdminApi = () => {
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
