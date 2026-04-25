import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useMemo, useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Form} from "@/lib/client/components/ui/form";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {FormZodError} from "@/lib/utils/error-classes";
import {ArrowDown, ArrowUp, Trash2} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {Skeleton} from "@/lib/client/components/ui/skeleton";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {useSearchContainer} from "@/lib/client/hooks/use-search-container";
import {SearchContainer} from "@/lib/client/components/general/SearchContainer";
import {RadioGroup, RadioGroupItem,} from "@/lib/client/components/ui/radio-group";
import {Controller, useFieldArray, useForm, useFormContext, useWatch} from "react-hook-form";
import {useProfileCustomMutation} from "@/lib/client/react-query/query-mutations/user.mutations";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/lib/client/components/ui/card";
import {profileCustomOptions, profileCustomSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {
    HIGHLIGHTED_MEDIA_TABS,
    HighlightedMediaRef,
    HighlightedMediaSearchItem,
    HighlightedMediaSettings,
    HighlightedMediaTab,
    PROFILE_MAX_HIGHLIGHTED_MEDIA,
} from "@/lib/types/profile-custom.types";


const modeOptions = [
    { value: "random", label: "Random", description: "Automatically pull random favorites from this list." },
    { value: "curated", label: "Curated", description: "Choose exactly which media to highlight." },
    { value: "disabled", label: "Disabled", description: "Hide this section on the profile tab." },
] as const;


const tabDescriptions: Record<HighlightedMediaTab, string> = {
    overview: "Mix media from any of your lists.",
    anime: "Only anime from your anime list.",
    books: "Only books from your books list.",
    games: "Only games from your games list.",
    manga: "Only manga from your manga list.",
    movies: "Only movies from your movies list.",
    series: "Only series from your series list.",
};


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
        // eslint-disable-next-line react-hooks/set-state-in-effect,@eslint-react/set-state-in-effect
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
                <div className="grid gap-6 xl:grid-cols-[200px_0.8fr]">
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


interface ProfileSidebarTabsProps {
    allFormValues: any;
    activeTab: HighlightedMediaTab;
    setActiveTab: (tab: HighlightedMediaTab) => void;
}


const ProfileSidebarTabs = ({ activeTab, setActiveTab, allFormValues }: ProfileSidebarTabsProps) => {
    const { currentUser } = useAuth();
    const activeMediaTypes = currentUser!.settings.filter((s) => s.active).map((s) => s.mediaType);
    const allTabs = ["overview", ...activeMediaTypes] as const;

    return (
        <div className="space-y-2">
            {allTabs.map((tab) => {
                const tabConfig = allFormValues[tab];
                const tabMode = tabConfig?.mode ?? "random";
                const tabItemsCount = tabConfig?.items?.length ?? 0;

                return (
                    <button
                        key={tab}
                        type="button"
                        onClick={() => setActiveTab(tab)}
                        className={cn("w-full rounded-lg border p-3 text-left transition-colors",
                            activeTab === tab ? "border-app-accent bg-app-accent/10" : "hover:bg-accent/40",
                        )}
                    >
                        <div className="flex items-center gap-2 font-medium capitalize">
                            <MainThemeIcon type={tab} size={16}/>
                            {tab}
                        </div>
                        <div className="mt-1 text-xs text-muted-foreground capitalize">
                            {tabMode === "curated" ?
                                <>{tabMode} - {tabItemsCount}/{PROFILE_MAX_HIGHLIGHTED_MEDIA}</>
                                :
                                <>{tabMode}</>
                            }
                        </div>
                    </button>
                );
            })}
        </div>
    )
}


interface TabCustomContentProps {
    isPending: boolean;
    rootError: string | null;
    activeTab: HighlightedMediaTab;
    setRootError: (error: string | null) => void;
    previewCache: Record<string, HighlightedMediaSearchItem>;
    setPreviewCache: React.Dispatch<React.SetStateAction<Record<string, HighlightedMediaSearchItem>>>;
}


const TabCustomContent = ({ activeTab, previewCache, setPreviewCache, setRootError, rootError, isPending }: TabCustomContentProps) => {
    const { register, control, formState: { isDirty } } = useFormContext<HighlightedMediaSettings>();
    const activeMode = useWatch({ control, name: `${activeTab}.mode` });

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base capitalize">
                    <MainThemeIcon type={activeTab} size={18}/>
                    {activeTab}
                </CardTitle>
                <CardDescription>
                    {tabDescriptions[activeTab]}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <Label htmlFor="highlighted-media-title">Custom Title</Label>
                    <Input
                        maxLength={50}
                        id="highlighted-media-title"
                        placeholder="Highlighted Media"
                        {...register(`${activeTab}.title`)}
                    />
                </div>

                <div className="space-y-3">
                    <Label>Display Mode</Label>
                    <Controller
                        control={control}
                        name={`${activeTab}.mode`}
                        render={({ field }) =>
                            <RadioGroup value={field.value} onValueChange={field.onChange}>
                                {modeOptions.map((option) =>
                                    <Label key={option.value} className="flex items-start gap-3 rounded-lg border p-3 font-normal">
                                        <RadioGroupItem
                                            className="mt-0.5"
                                            value={option.value}
                                        />
                                        <div>
                                            <div className="font-medium text-primary">
                                                {option.label}
                                            </div>
                                            <div className="text-xs text-muted-foreground">
                                                {option.description}
                                            </div>
                                        </div>
                                    </Label>
                                )}
                            </RadioGroup>
                        }
                    />
                </div>

                {activeMode === "curated" &&
                    <CuratedMediaManager
                        activeTab={activeTab}
                        previewCache={previewCache}
                        setRootError={setRootError}
                        setPreviewCache={setPreviewCache}
                    />
                }

                {rootError &&
                    <p className="text-sm font-medium text-destructive">
                        {rootError}
                    </p>
                }

                <Button type="submit" disabled={!isDirty || isPending}>
                    Save Customization
                </Button>
            </CardContent>
        </Card>
    );
};


interface CuratedMediaManagerProps {
    activeTab: HighlightedMediaTab;
    setRootError: (error: string | null) => void;
    previewCache: Record<string, HighlightedMediaSearchItem>;
    setPreviewCache: React.Dispatch<React.SetStateAction<Record<string, HighlightedMediaSearchItem>>>;
}


export const CuratedMediaManager = ({ activeTab, previewCache, setPreviewCache, setRootError }: CuratedMediaManagerProps) => {
    const { control } = useFormContext<HighlightedMediaSettings>();
    const { fields, append, remove, swap } = useFieldArray({ control, name: `${activeTab}.items` });
    const selectedKeys = useMemo(() => new Set(fields.map((f: any) => toItemKey(f))), [fields]);
    const { containerRef, search, setSearch, isOpen, debouncedSearch, reset } = useSearchContainer({
        onReset: () => setRootError(null),
    });

    const { data: searchResults, isFetching, error } = useQuery(profileCustomSearchOptions(activeTab, debouncedSearch));

    const handleAddItem = (item: HighlightedMediaSearchItem) => {
        if (selectedKeys.has(toItemKey(item)) || fields.length >= PROFILE_MAX_HIGHLIGHTED_MEDIA) return;

        setPreviewCache((prev) => ({ ...prev, [toItemKey(item)]: item }));
        append({ mediaId: item.mediaId, mediaType: item.mediaType });
        reset();
    };

    return (
        <div className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="highlighted-media-search">
                    Add Media
                </Label>
                <div ref={containerRef} className="relative">
                    <Input
                        value={search}
                        inputMode="search"
                        id="highlighted-media-search"
                        onChange={(ev) => setSearch(ev.target.value)}
                        placeholder={activeTab === "overview"
                            ? "Search in your lists..."
                            : `Search in your ${activeTab} list...`
                        }
                    />
                    <SearchContainer
                        error={error}
                        search={search}
                        isOpen={isOpen}
                        isPending={isFetching}
                        debouncedSearch={debouncedSearch}
                        hasResults={!!searchResults?.length}
                        emptyMessage="No Matching Media Found in Your List."
                    >
                        <div className="max-h-80 divide-y overflow-y-auto">
                            {searchResults?.map((item) => {
                                const isSelected = selectedKeys.has(toItemKey(item));
                                const isAtLimit = fields.length >= PROFILE_MAX_HIGHLIGHTED_MEDIA;

                                return (
                                    <button
                                        type="button"
                                        key={toItemKey(item)}
                                        disabled={isSelected || isAtLimit}
                                        onClick={() => handleAddItem(item)}
                                        className="flex w-full items-center gap-3 p-3 text-left hover:bg-accent/40 disabled:opacity-50"
                                    >
                                        <img
                                            alt={item.mediaName}
                                            src={item.mediaCover}
                                            className="h-14 w-10 rounded object-cover"
                                        />
                                        <div className="min-w-0 flex-1">
                                            <div className="line-clamp-1 font-medium">
                                                {item.mediaName}
                                            </div>
                                            <div className="text-xs text-muted-foreground capitalize">
                                                {item.mediaType}
                                            </div>
                                        </div>
                                        <span className="text-xs font-medium text-muted-foreground">
                                            {isSelected ? "Added" : isAtLimit && "Limit reached"}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </SearchContainer>
                </div>
                <p className="text-xs text-muted-foreground">
                    Search only uses your list data. Overview can mix media types.
                </p>
            </div>

            <div className="space-y-3">
                <div>
                    <Label>Curated Items</Label>
                    <p className="text-xs text-muted-foreground">
                        Up to {PROFILE_MAX_HIGHLIGHTED_MEDIA} items. Use arrows to control order.
                    </p>
                </div>

                {fields.length === 0 ?
                    <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                        No Media Selected Yet.
                    </div>
                    :
                    <div className="space-y-2">
                        {fields.map((field: any, index) => {
                            const itemKey = toItemKey(field);
                            const preview = previewCache[itemKey] || searchResults?.find(r => toItemKey(r) === itemKey);

                            return (
                                <CuratedItemRow
                                    item={field}
                                    onMove={swap}
                                    idx={index}
                                    key={field.id}
                                    preview={preview}
                                    onRemove={remove}
                                    total={fields.length}
                                />
                            );
                        })}
                    </div>
                }
            </div>
        </div>
    )
}


interface CuratedItemRowProps {
    idx: number;
    total: number;
    item: HighlightedMediaRef;
    onRemove: (idx: number) => void;
    preview?: HighlightedMediaSearchItem;
    onMove: (idxA: number, idxB: number) => void;
}


const CuratedItemRow = ({ idx, total, item, preview, onMove, onRemove }: CuratedItemRowProps) => {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-14 w-10 items-center justify-center rounded bg-accent text-xs text-muted-foreground">
                {idx + 1}
            </div>
            <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-medium">
                    {preview?.mediaName ?? `Media #${item.mediaId}`}
                </div>
                <div className="text-xs text-muted-foreground capitalize">
                    {item.mediaType}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    disabled={idx === 0}
                    aria-label="Move item up"
                    onClick={() => onMove(idx, idx - 1)}
                >
                    <ArrowUp size={16}/>
                </Button>
                <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    aria-label="Move item down"
                    disabled={idx === total - 1}
                    onClick={() => onMove(idx, idx + 1)}
                >
                    <ArrowDown size={16}/>
                </Button>
                <Button
                    size="sm"
                    type="button"
                    variant="outline"
                    aria-label="Delete item"
                    onClick={() => onRemove(idx)}
                >
                    <Trash2 size={16}/>
                </Button>
            </div>
        </div>
    );
};


const cloneSettings = (settings: HighlightedMediaSettings) => {
    return JSON.parse(JSON.stringify(settings)) as HighlightedMediaSettings;
};


const toItemKey = (item: { mediaId: number; mediaType: string }) => {
    return `${item.mediaType}-${item.mediaId}`;
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
