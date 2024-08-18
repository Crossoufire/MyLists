import {toast} from "sonner";
import {api} from "@/api/MyApiClient";


export const useApiUpdater = (mediaId, mediaType) => {
    const makeUpdateFunction = (url) => async (payload = null, errorAsToast = true) => {
        const response = await api.post(url, {
            media_id: mediaId,
            media_type: mediaType,
            payload: payload,
        });

        if (!response.ok) {
            errorAsToast && toast.error(response.body?.description || "Sorry, an unexpected error occurred");
            return false;
        }

        return response.body?.data || true;
    };

    const actions = {
        addMedia: `/list/${mediaType}/add`,
        deleteMedia: `/list/${mediaType}/delete`,
        favorite: `/list/${mediaType}/favorite`,
        status: `/list/${mediaType}/status`,
        rating: `/list/${mediaType}/rating`,
        redo: `/list/${mediaType}/redo`,
        season: `/list/${mediaType}/season`,
        episode: `/list/${mediaType}/episode`,
        page: `/list/${mediaType}/page`,
        playtime: `/list/${mediaType}/playtime`,
        comment: `/list/${mediaType}/comment`,
        refresh: `/media/${mediaType}/refresh`,
        removeLabelFromMedia: `/list/${mediaType}/label/remove`,
        addMediaToLabel: `/list/${mediaType}/label/add`,
    };

    const updateFunctions = {};
    for (const [action, url] of Object.entries(actions)) {
        updateFunctions[action] = makeUpdateFunction(url);
    }

    return updateFunctions;
};