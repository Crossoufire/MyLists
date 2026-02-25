import {toast} from "sonner";
import {useMutation, useQueryClient} from "@tanstack/react-query";
import {collectionDetailsReadOptions} from "@/lib/client/react-query/query-options/query-options";
import {postCopyCollection, postCreateCollection, postDeleteCollection, postToggleCollectionLike, postUpdateCollection} from "@/lib/server/functions/collections";


export const useCreateCollectionMutation = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postCreateCollection,
        onSuccess: async () => {
            toast.success("New collection created!");
            await queryClient.invalidateQueries({ queryKey: ["collections", "user"] });
            await queryClient.invalidateQueries({ queryKey: ["collections", "community"] });
        },
    });
};


export const useUpdateCollectionMutation = (collectionId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateCollection,
        meta: { successMessage: "Collection updated." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["collections", "user"] });
            await queryClient.invalidateQueries({ queryKey: collectionDetailsReadOptions(collectionId).queryKey });
        },
    });
};


export const useToggleCollectionLikeMutation = (collectionId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postToggleCollectionLike,
        onError: () => toast.error("Failed to update the like."),
        onSuccess: async () => {
            queryClient.setQueryData(collectionDetailsReadOptions(collectionId).queryKey, (oldData) => {
                if (!oldData) return;
                return {
                    ...oldData,
                    isLiked: !oldData.isLiked,
                    collection: {
                        ...oldData.collection,
                        likeCount: oldData.isLiked ? oldData.collection.likeCount - 1 : oldData.collection.likeCount + 1,
                    }
                }
            });

            await queryClient.invalidateQueries({ queryKey: ["collections", "community"] });
        },
    });
};


export const useCopyCollectionMutation = (collectionId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postCopyCollection,
        meta: { successMessage: "Collection copied." },
        onError: () => toast.error("Failed to copy the collection."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["collections", "community"] });
            await queryClient.invalidateQueries({ queryKey: collectionDetailsReadOptions(collectionId).queryKey });
        },
    });
};


export const useDeleteCollectionMutation = (collectionId: number) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postDeleteCollection,
        meta: { successMessage: "Collection deleted." },
        onError: () => toast.error("Failed to delete the collection."),
        onSuccess: async () => {
            await queryClient.invalidateQueries({ queryKey: ["collections", "user"] });
            await queryClient.invalidateQueries({ queryKey: ["collections", "community"] });
            await queryClient.invalidateQueries({ queryKey: collectionDetailsReadOptions(collectionId).queryKey });
        },
    });
};
