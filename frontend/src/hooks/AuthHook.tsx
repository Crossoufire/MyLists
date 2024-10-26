import {queryClient} from "@/api/queryClient";
import {authOptions} from "@/api/queryOptions";
import {api, ApiResponse} from "@/api/apiClient";
import {useMutation, useQuery} from "@tanstack/react-query";
import {LoginData, UseAuthReturn, User} from "@/utils/types";


export const useAuth = (): UseAuthReturn => {
    const {data: currentUser, isLoading} = useQuery<User | null, Error, User | null>(authOptions());

    const setCurrentUser = (updates: User | null) => {
        queryClient.setQueryData(authOptions().queryKey, updates);
    };

    const login = useMutation<LoginData, Error, { username: string; password: string }>({
        mutationFn: ({username, password}) => api.login(username, password),
        onSuccess: async (data) => {
            api.setAccessToken(data.body.access_token);
            queryClient.setQueryData(authOptions().queryKey, data.body.data);
        },
    });

    const oAuth2Login = useMutation<LoginData, Error, { provider: string; data: any }>({
        mutationFn: ({provider, data}: { provider: string, data: any }) => api.oAuth2Login(provider, data),
        onSuccess: async (data) => {
            api.setAccessToken(data.body.access_token);
            queryClient.setQueryData(authOptions().queryKey, data.body.data);
        },
    });

    const logout = useMutation({
        mutationFn: () => api.logout(),
        onSuccess: () => {
            api.removeAccessToken();
            setCurrentUser(null);
        },
    });

    const register = useMutation<any, any, { data: any }>({
        mutationFn: ({data}) => api.register(data),
    });

    return {currentUser, isLoading, setCurrentUser, login, oAuth2Login, logout, register};
};
