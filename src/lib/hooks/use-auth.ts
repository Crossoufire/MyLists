import {useSuspenseQuery} from "@tanstack/react-query";
import {authOptions} from "@/lib/react-query/query-options";


export const useAuth = () => {
    const { data: currentUser, isLoading, isPending } = useSuspenseQuery(authOptions());
    return { currentUser, isLoading, isPending };
};
