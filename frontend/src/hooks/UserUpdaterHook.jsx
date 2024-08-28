import {toast} from "sonner";
import {api} from "@/api/MyApiClient";


export const usePostMediaCreator = (mediaId, mediaType) => {

    const mutationFunctionMaker = (url) => async (payload = null, errorAsToast = true) => {
        const response = await api.post(url, {
            media_id: mediaId,
            media_type: mediaType,
            payload: payload,
        });

        if (!response.ok) {
            errorAsToast && toast.error(response.body?.description || "An unexpected error occurred");
            return false;
        }

        return response.body?.data || true;
    };

    const actions = {
        addMedia: "/add_media",
        deleteMedia: "/delete_media",
        favorite: "/update_favorite",
        status: "/update_status",
        rating: "/update_rating",
        redo: "/update_redo",
        season: "/update_season",
        episode: "/update_episode",
        page: "/update_page",
        playtime: "/update_playtime",
        comment: "/update_comment",
        refresh: "/details/refresh",
        addBookCover: "/details/add_book_cover",
        removeLabelFromMedia: "/remove_label_from_media",
        addMediaToLabel: "/add_media_to_label",
    };

    const mutationFunctions = {};
    for (const [action, url] of Object.entries(actions)) {
        mutationFunctions[action] = mutationFunctionMaker(url);
    }

    return mutationFunctions;
};