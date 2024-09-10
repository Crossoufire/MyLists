import {postFetcher} from "@/api/fetcher";
import {useMutation} from "@tanstack/react-query";
import {mutationFunctionsMap as mediaMutations} from "@/api/mutations/mediaMutations";


const mutationFunctionsMap = {
    renameLabel: ({ mediaType, oldName, newName }) => postFetcher({
        url: "/rename_label", data: { media_type: mediaType, old_label_name: oldName, new_label_name: newName },
    }),
    deleteLabel: ({ mediaType, name }) => postFetcher({
        url: "/delete_label", data: { media_type: mediaType, name },
    }),
};

export const userLabelsMutations = (mediaType, mediaId) => {
    const addLabel = useAddLabelMutation("add_media_to_label", mediaType, mediaId);
    const removeLabel = useRemoveLabelMutation("remove_label_from_media", mediaType, mediaId);
    const renameLabel = useRenameLabelMutation(mediaType);
    const deleteLabel = useDeleteLabelMutation(mediaType);

    return { addLabel, removeLabel, renameLabel, deleteLabel };
};

const useAddLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => {
            return mediaMutations.updateUserMedia({ url, mediaType, mediaId, payload });
        },
    });
};

const useRemoveLabelMutation = (url, mediaType, mediaId) => {
    return useMutation({
        mutationFn: ({ payload }) => {
            return mediaMutations.updateUserMedia({ url, mediaType, mediaId, payload });
        },
    });
};

const useRenameLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ oldName, newName }) => {
            return mutationFunctionsMap.renameLabel({ mediaType, oldName, newName });
        },
    });
};

const useDeleteLabelMutation = (mediaType) => {
    return useMutation({
        mutationFn: ({ name }) => mutationFunctionsMap.deleteLabel({ mediaType, name }),
    });
};
