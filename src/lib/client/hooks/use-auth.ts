import {useQueryClient, useSuspenseQuery} from "@tanstack/react-query";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const { data: currentUser } = useSuspenseQuery(authOptions);

    const setCurrentUser = async () => {
        await queryClient.invalidateQueries({ queryKey: authOptions.queryKey });
    };

    return {
        currentUser,
        setCurrentUser,
    };
};
