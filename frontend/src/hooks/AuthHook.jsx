import {api} from "@/api/apiClient";
import {queryClient} from "@/api/queryClient";
import {authOptions, queryKeys} from "@/api/queryOptions";
import {useMutation, useQuery} from "@tanstack/react-query";


export const useAuth = () => {
    const { data: currentUser, isLoading } = useQuery(authOptions());

    const setCurrentUser = (updates) => {
        queryClient.setQueryData(queryKeys.authKey(), updates);
    };

    const login = useMutation({
        mutationFn: ({ username, password }) => api.login(username, password),
        onSuccess: async (data) => {
            api.setAccessToken(data.body.access_token);
            queryClient.setQueryData(queryKeys.authKey(), data.body.data);
        },
    });

    const oAuth2Login = useMutation({
        mutationFn: ({ provider, data }) => api.oAuth2Login(provider, data),
        onSuccess: async (data) => {
            api.setAccessToken(data.body.access_token);
            queryClient.setQueryData(queryKeys.authKey(), data.body.data);
        },
    });

    const logout = useMutation({
        mutationFn: () => api.logout(),
        onSuccess: () => {
            api.removeAccessToken();
            setCurrentUser(null);
        },
    });

    const register = useMutation({
        mutationFn: ({ data }) => api.register(data),
    });

    return { currentUser, isLoading, login, oAuth2Login, logout, register, setCurrentUser };
};
