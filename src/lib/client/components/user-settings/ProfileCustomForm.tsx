import {toast} from "sonner";
import {useEffect, useState} from "react";
import {useQuery} from "@tanstack/react-query";
import {toItemKey} from "@/lib/utils/formating";
import {useForm, useWatch} from "react-hook-form";
import {Form} from "@/lib/client/components/ui/form";
import {FormZodError} from "@/lib/utils/error-classes";
import {Skeleton} from "@/lib/client/components/ui/skeleton";
import {profileCustomOptions} from "@/lib/client/react-query/query-options/query-options";
import {useProfileCustomMutation} from "@/lib/client/react-query/query-mutations/user.mutations";
import {TabCustomContent} from "@/lib/client/components/user-settings/profile-custom/TabCustomContent";
import {ProfileSidebarTabs} from "@/lib/client/components/user-settings/profile-custom/ProfileSidebarTabs";
import {HIGHLIGHTED_MEDIA_TABS, HighlightedMediaSearchItem, HighlightedMediaSettings, HighlightedMediaTab,} from "@/lib/types/profile-custom.types";


export const ProfileCustomForm = () => {
    const mutation = useProfileCustomMutation();
    const form = useForm<HighlightedMediaSettings>();
    const { data, isPending, error } = useQuery(profileCustomOptions);
    const [rootError, setRootError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<HighlightedMediaTab>("overview");
    const [previewCache, setPreviewCache] = useState<Record<string, HighlightedMediaSearchItem>>({});

    const allFormValues = useWatch({ control: form.control });

    useEffect(() => {
        if (!data) return;
        const defaultValues = cloneSettings(data.settings);
        form.reset(defaultValues);
        // eslint-disable-next-line @eslint-react/set-state-in-effect,react-hooks/set-state-in-effect
        setPreviewCache(buildPreviewCache(data.previews));
    }, [data, form, form.reset]);

    const onSubmit = (formData: HighlightedMediaSettings) => {
        setRootError(null);
        mutation.mutate({ data: formData }, {
            onError: (err) => {
                if (err instanceof FormZodError && err.issues.length > 0) {
                    const issue = err.issues[0];
                    const issueTab = issue?.path?.[0];
                    if (typeof issueTab === "string" && HIGHLIGHTED_MEDIA_TABS.includes(issueTab as any)) {
                        setActiveTab(issueTab as HighlightedMediaTab);
                    }
                    setRootError(issue?.message ?? "Customization could not be saved.");
                    return;
                }
                setRootError(err?.message ?? "Customization could not be saved.");
            },
            onSuccess: (savedData) => {
                form.reset(cloneSettings(savedData));
                toast.success("Customization updated");
            },
        });
    };

    if (isPending || !allFormValues || Object.keys(allFormValues).length === 0) {
        return (
            <div className="space-y-4">
                <Skeleton className="h-7 w-56"/>
                <Skeleton className="h-24 w-full"/>
                <Skeleton className="h-80 w-full"/>
            </div>
        );
    }

    if (error) {
        return (
            <p className="text-sm text-destructive">
                Failed to load customization settings.
            </p>
        );
    }

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <div>
                    <h2 className="text-lg font-semibold text-primary">
                        Profile Customization
                    </h2>
                    <p className="text-sm text-muted-foreground">
                        Configure the Highlighted Media block independently for each profile tab.
                    </p>
                </div>
                <div className="grid gap-6 grid-cols-[200px_0.8fr] max-lg:grid-cols-1">
                    <ProfileSidebarTabs
                        activeTab={activeTab}
                        setActiveTab={setActiveTab}
                        allFormValues={allFormValues}
                    />

                    <TabCustomContent
                        key={activeTab}
                        rootError={rootError}
                        activeTab={activeTab}
                        previewCache={previewCache}
                        setRootError={setRootError}
                        isPending={mutation.isPending}
                        setPreviewCache={setPreviewCache}
                    />
                </div>
            </form>
        </Form>
    );
};


const cloneSettings = (settings: HighlightedMediaSettings) => {
    return JSON.parse(JSON.stringify(settings)) as HighlightedMediaSettings;
};


const buildPreviewCache = (previews: Record<string, { items: HighlightedMediaSearchItem[] }>) => {
    return Object.values(previews)
        .reduce<Record<string, HighlightedMediaSearchItem>>((acc, tabPreview) => {
            tabPreview.items.forEach((item) => {
                acc[toItemKey(item)] = item;
            });
            return acc;
        }, {});
};
