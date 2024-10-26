import {MediaType} from "@/utils/types.tsx";
import {postFetcher} from "@/api/fetcher";
import {useMutation} from "@tanstack/react-query";
import {mutationFunctionsMap as mediaMutations} from "@/api/mutations/mediaMutations";


interface MutationFunctionsMap {
    deleteLabel: (params: { mediaType: MediaType, name: string }) => Promise<any>;
    renameLabel: (params: { mediaType: MediaType, oldName: string, newName: string }) => Promise<any>;
}


const mutationFunctionsMap: MutationFunctionsMap = {
    renameLabel: ({mediaType, oldName, newName}) => postFetcher({
        url: "/rename_label", data: {media_type: mediaType, old_label_name: oldName, new_label_name: newName},
    }),
    deleteLabel: ({mediaType, name}) => postFetcher({
        url: "/delete_label", data: {media_type: mediaType, name},
    }),
};


export const userLabelsMutations = (mediaType: MediaType, mediaId: number) => {
    const addLabel = useAddLabelMutation("add_media_to_label", mediaType, mediaId);
    const removeLabel = useRemoveLabelMutation("remove_label_from_media", mediaType, mediaId);
    const renameLabel = useRenameLabelMutation(mediaType);
    const deleteLabel = useDeleteLabelMutation(mediaType);

    return {addLabel, removeLabel, renameLabel, deleteLabel};
};


const useAddLabelMutation = (url: string, mediaType: MediaType, mediaId: number) => {
    return useMutation({
        mutationFn: ({payload}: { payload: string }) => {
            return mediaMutations.updateUserMedia({url, mediaType, mediaId, payload});
        },
    });
};


const useRemoveLabelMutation = (url: string, mediaType: MediaType, mediaId: number) => {
    return useMutation({
        mutationFn: ({payload}: { payload: string }) => {
            return mediaMutations.updateUserMedia({url, mediaType, mediaId, payload});
        },
    });
};


const useRenameLabelMutation = (mediaType: MediaType) => {
    return useMutation({
        mutationFn: ({oldName, newName}: { oldName: string, newName: string }) => {
            return mutationFunctionsMap.renameLabel({mediaType, oldName, newName});
        },
    });
};


const useDeleteLabelMutation = (mediaType: MediaType) => {
    return useMutation({
        mutationFn: ({name}: { name: string }) => mutationFunctionsMap.deleteLabel({mediaType, name}),
    });
};
