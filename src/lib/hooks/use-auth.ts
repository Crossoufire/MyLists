import {authOptions, queryKeys} from "@/lib/react-query/query-options/query-options";
import {useQueryClient, useSuspenseQuery} from "@tanstack/react-query";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const { data: currentUser, isLoading, isPending } = useSuspenseQuery(authOptions());

    const setCurrentUser = (userData: Record<string, any> | null | undefined) => {
        queryClient.setQueryData(queryKeys.authKey(), userData);
    };

    return { currentUser, setCurrentUser, isLoading, isPending };
};
