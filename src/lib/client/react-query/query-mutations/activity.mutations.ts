import {useMutation, useQueryClient} from "@tanstack/react-query";
import {MediaType} from "@/lib/utils/enums";
import {postDeleteActivityEvent, postUpdateActivityEvent} from "@/lib/server/functions/user-stats";


export const useUpdateActivityEventMutation = (args: {
    username: string;
    year: number;
    month: number;
    mediaType?: MediaType;
    mediaId?: number;
}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postUpdateActivityEvent,
        meta: { errorMessage: "Failed to update activity event." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["userActivityEvents", args.username, String(args.year), String(args.month)]
            });
            await queryClient.invalidateQueries({
                queryKey: ["userStats-activity", args.username, String(args.year), String(args.month)]
            });
            await queryClient.invalidateQueries({
                queryKey: ["userStats-section", args.username, String(args.year), String(args.month)]
            });
        },
    });
};


export const useDeleteActivityEventMutation = (args: {
    username: string;
    year: number;
    month: number;
    mediaType?: MediaType;
    mediaId?: number;
}) => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: postDeleteActivityEvent,
        meta: { errorMessage: "Failed to delete activity event." },
        onSuccess: async () => {
            await queryClient.invalidateQueries({
                queryKey: ["userActivityEvents", args.username, String(args.year), String(args.month)]
            });
            await queryClient.invalidateQueries({
                queryKey: ["userStats-activity", args.username, String(args.year), String(args.month)]
            });
            await queryClient.invalidateQueries({
                queryKey: ["userStats-section", args.username, String(args.year), String(args.month)]
            });
        },
    });
};
