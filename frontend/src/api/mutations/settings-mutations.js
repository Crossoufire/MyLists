import {fetcher, postFetcher} from "@/api";
import {useMutation} from "@tanstack/react-query";


const settingsUrls = {
    generalSettings: () => "/settings/general",
    listSettings: () => "/settings/medialist",
    deleteAccount: () => "/settings/delete_account",
    passwordSettings: () => "/settings/password",
    downloadListAsCSV: (selectedList) => `/settings/download/${selectedList}`,
};


export const useGeneralSettingsMutation = () => {
    return useMutation({
        mutationFn: ({ data }) =>
            postFetcher({
                url: settingsUrls.generalSettings(),
                data,
                options: { removeContentType: true },
            }),
    });
};


export const useListSettingsMutation = () => {
    return useMutation({
        mutationFn: (data) =>
            postFetcher({
                url: settingsUrls.listSettings(),
                data,
            }),
    });
};


export const useDeleteAccountMutation = () => {
    return useMutation({
        mutationFn: () =>
            postFetcher({
                url: settingsUrls.deleteAccount(),
            }),
    });
};


export const usePasswordSettingsMutation = () => {
    return useMutation({
        mutationFn: (data) =>
            postFetcher({
                url: settingsUrls.passwordSettings(),
                data,
            }),
    });
};


export const useDownloadListAsCSVMutation = () => {
    return useMutation({
        mutationFn: ({ selectedList }) =>
            fetcher({
                url: settingsUrls.downloadListAsCSV(selectedList),
            }),
    });
};
