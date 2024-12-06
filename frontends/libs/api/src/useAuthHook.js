import {getApiClient} from "./apiClient";
import {authOptions, queryKeys} from "./queryOptions";
import {useMutation, useQuery, useQueryClient} from "@tanstack/react-query";


export const useAuth = () => {
    const queryClient = useQueryClient();
    const { data: currentUser, isLoading } = useQuery(authOptions());

    const setCurrentUser = (updates) => {
        queryClient.setQueryData(queryKeys.authKey(), updates);
    };

    const login = useMutation({
        mutationFn: ({ username, password }) => getApiClient().login(username, password),
        onSuccess: async (data) => {
            getApiClient().setAccessToken(data.body.access_token);
            queryClient.setQueryData(queryKeys.authKey(), data.body.data);
        },
    });

    const oAuth2Login = useMutation({
        mutationFn: ({ provider, data }) => getApiClient().oAuth2Login(provider, data),
        onSuccess: async (data) => {
            getApiClient().setAccessToken(data.body.access_token);
            queryClient.setQueryData(queryKeys.authKey(), data.body.data);
        },
    });

    const logout = useMutation({
        mutationFn: () => getApiClient().logout(),
        onSuccess: () => {
            getApiClient().removeAccessToken();
            setCurrentUser(null);
        },
    });

    const register = useMutation({
        mutationFn: ({ data }) => getApiClient().register(data),
    });

    return { currentUser, isLoading, login, oAuth2Login, logout, register, setCurrentUser };
};
