import {useQuery, useQueryClient} from "@tanstack/react-query";
import {authOptions, queryKeys} from "@/lib/react-query/query-options/query-options";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const { data: currentUser, isLoading, isPending } = useQuery(authOptions());

    const setCurrentUser = async () => {
        await queryClient.invalidateQueries({ queryKey: queryKeys.authKey() });
    };

    return {
        currentUser: currentUser,
        setCurrentUser,
        isLoading,
        isPending,
    };
};
