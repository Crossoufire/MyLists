import {fetcher, postFetcher} from "@/api";
import {useMutation} from "@tanstack/react-query";


const authUrls = {
    resetPassword: () => "/tokens/reset_password",
    registerToken: () => "/tokens/register_token",
    forgotPassword: () => "/tokens/reset_password_token",
    oauth2Provider: (provider) => `/tokens/oauth2/${provider}`,
};


export const useResetPasswordMutation = () => {
    return useMutation({
        mutationFn: ({ token, new_password }) =>
            postFetcher({
                url: authUrls.resetPassword(),
                data: { token, new_password },
            }),
    });
};


export const useRegisterTokenMutation = () => {
    return useMutation({
        mutationFn: ({ token }) =>
            postFetcher({
                url: authUrls.registerToken(),
                data: { token },
            }),
    });
};


export const useForgotPasswordMutation = () => {
    return useMutation({
        mutationFn: ({ email, callback }) =>
            postFetcher({
                url: authUrls.forgotPassword(),
                data: { email, callback },
            }),
    });
};


export const useOAuth2ProviderMutation = () => {
    return useMutation({
        mutationFn: ({ provider, callback }) => fetcher({
            url: authUrls.oauth2Provider(provider),
            queryOrData: { callback },
        }),
    });
};
