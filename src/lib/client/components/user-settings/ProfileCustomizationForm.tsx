import {toast} from "sonner";
import {cn} from "@/lib/utils/helpers";
import {useQuery} from "@tanstack/react-query";
import {capitalize} from "@/lib/utils/formating";
import {useEffect, useMemo, useState} from "react";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {FormZodError} from "@/lib/utils/error-classes";
import {Button} from "@/lib/client/components/ui/button";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {Skeleton} from "@/lib/client/components/ui/skeleton";
import {MainThemeIcon} from "@/lib/client/components/general/MainIcons";
import {RadioGroup, RadioGroupItem} from "@/lib/client/components/ui/radio-group";
import {useProfileCustomMutation} from "@/lib/client/react-query/query-mutations/user.mutations";
import {Card, CardContent, CardDescription, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {profileCustomOptions, profileCustomSearchOptions} from "@/lib/client/react-query/query-options/query-options";
import {HIGHLIGHTED_MEDIA_TABS, HighlightedMediaSearchItem, HighlightedMediaSettings, HighlightedMediaTab, PROFILE_MAX_HIGHLIGHTED_MEDIA} from "@/lib/types/profile-custom.types";
import {ArrowDown, ArrowUp, Trash2} from "lucide-react";


const modeOptions = [
    { value: "random", label: "Random", description: "Automatically pull random favorites from this tab's list." },
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


export const ProfileCustomizationForm = () => {
    const mutation = useProfileCustomMutation();
    const [search, setSearch] = useState("");
    const debouncedSearch = useDebounce(search, 250);
    const [savedSnapshot, setSavedSnapshot] = useState("");
    const { data, isPending, error } = useQuery(profileCustomOptions);
    const [rootError, setRootError] = useState<string | null>(null);
    const [draft, setDraft] = useState<HighlightedMediaSettings | null>(null);
    const [activeTab, setActiveTab] = useState<HighlightedMediaTab>("overview");
    const [previewCache, setPreviewCache] = useState<Record<string, HighlightedMediaSearchItem>>({});

    useEffect(() => {
        if (!data) return;
        const nextDraft = cloneSettings(data.settings);
        // eslint-disable-next-line react-hooks/set-state-in-effect,@eslint-react/set-state-in-effect
        setDraft(nextDraft);
        // eslint-disable-next-line @eslint-react/set-state-in-effect
        setSavedSnapshot(JSON.stringify(nextDraft));
        // eslint-disable-next-line @eslint-react/set-state-in-effect
        setPreviewCache(buildPreviewCache(data.previews));
    }, [data]);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect,@eslint-react/set-state-in-effect
        setSearch("");
        // eslint-disable-next-line @eslint-react/set-state-in-effect
        setRootError(null);
    }, [activeTab]);

    const activeConfig = draft?.[activeTab];
    const isDirty = !!draft && JSON.stringify(draft) !== savedSnapshot;
    const { data: searchResults, isFetching: isSearching } = useQuery(profileCustomSearchOptions(activeTab, debouncedSearch));
    const selectedKeys = useMemo(() => new Set((activeConfig?.items ?? []).map(toItemKey)), [activeConfig?.items]);

    const updateTab = (tab: HighlightedMediaTab, updater: (current: HighlightedMediaSettings[HighlightedMediaTab]) => HighlightedMediaSettings[HighlightedMediaTab]) => {
        setDraft((current) => {
            if (!current) return current;
            return {
                ...current,
                [tab]: updater(current[tab]),
            };
        });
    };

    const handleAddItem = (item: HighlightedMediaSearchItem) => {
        if (!activeConfig || selectedKeys.has(toItemKey(item)) || activeConfig.items.length >= PROFILE_MAX_HIGHLIGHTED_MEDIA) return;

        setPreviewCache((current) => ({ ...current, [toItemKey(item)]: item }));
        updateTab(activeTab, (current) => ({
            ...current,
            items: [...current.items, { mediaId: item.mediaId, mediaType: item.mediaType }],
        }));
    };

    const handleRemoveItem = (index: number) => {
        updateTab(activeTab, (current) => ({
            ...current,
            items: current.items.filter((_, itemIndex) => itemIndex !== index),
        }));
    };

    const handleMoveItem = (index: number, direction: -1 | 1) => {
        updateTab(activeTab, (current) => {
            const nextIndex = index + direction;
            if (nextIndex < 0 || nextIndex >= current.items.length) return current;

            const items = [...current.items];
            [items[index], items[nextIndex]] = [items[nextIndex], items[index]];
            return { ...current, items };
        });
    };

    const handleSave = () => {
        if (!draft) return;

        const invalidTab = HIGHLIGHTED_MEDIA_TABS.find((tab) => draft[tab].mode === "curated" && draft[tab].items.length === 0);
        if (invalidTab) {
            setActiveTab(invalidTab);
            setRootError("Curated mode requires at least 1 item. Add media or switch that tab to Random or Disabled.");
            return;
        }

        setRootError(null);
        mutation.mutate({ data: draft }, {
            onError: (err: any) => {
                if (err instanceof FormZodError && err.issues.length > 0) {
                    const issue = err.issues[0];
                    const issueTab = issue?.path?.[0];
                    if (typeof issueTab === "string" && HIGHLIGHTED_MEDIA_TABS.includes(issueTab as HighlightedMediaTab)) {
                        setActiveTab(issueTab as HighlightedMediaTab);
                    }
                    setRootError(issue?.message ?? "Customization could not be saved.");
                    return;
                }

                setRootError(err?.message ?? "Customization could not be saved.");
            },
            onSuccess: (savedData) => {
                const nextDraft = cloneSettings(savedData);
                setDraft(nextDraft);
                setSavedSnapshot(JSON.stringify(nextDraft));
                toast.success("Customization updated");
            },
        });
    };

    if (isPending || !draft) {
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
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold text-primary">Profile Customization</h2>
                <p className="text-sm text-muted-foreground">
                    Configure the Highlighted Media block independently for each profile tab.
                </p>
            </div>

            <div className="grid gap-6 xl:grid-cols-[220px_1fr]">
                <div className="space-y-2">
                    {HIGHLIGHTED_MEDIA_TABS.map((tab) => {
                        const tabConfig = draft[tab];

                        return (
                            <button
                                key={tab}
                                type="button"
                                onClick={() => setActiveTab(tab)}
                                className={cn(
                                    "w-full rounded-lg border p-3 text-left transition-colors",
                                    activeTab === tab ? "border-app-accent bg-app-accent/10" : "hover:bg-accent/40",
                                )}
                            >
                                <div className="flex items-center gap-2 font-medium">
                                    <MainThemeIcon type={tab} size={16}/>
                                    {tab === "overview" ? "Overview" : capitalize(tab)}
                                </div>
                                <div className="mt-1 text-xs text-muted-foreground">
                                    {capitalize(tabConfig.mode)}
                                    {" · "}
                                    {tabConfig.items.length}/{PROFILE_MAX_HIGHLIGHTED_MEDIA}
                                </div>
                            </button>
                        );
                    })}
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-base">
                            <MainThemeIcon type={activeTab} size={18}/>
                            {activeTab === "overview" ? "Overview" : capitalize(activeTab)}
                        </CardTitle>
                        <CardDescription>{tabDescriptions[activeTab]}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="highlighted-media-title">Custom Title</Label>
                            <Input
                                maxLength={50}
                                id="highlighted-media-title"
                                placeholder="Highlighted Media"
                                value={activeConfig?.title ?? ""}
                                onChange={(ev) => updateTab(activeTab, (current) => ({ ...current, title: ev.target.value }))}
                            />
                        </div>

                        <div className="space-y-3">
                            <Label>Display Mode</Label>
                            <RadioGroup
                                value={activeConfig?.mode}
                                onValueChange={(value) => updateTab(activeTab, (current) => ({ ...current, mode: value as typeof current.mode }))}
                            >
                                {modeOptions.map((option) =>
                                    <Label
                                        key={option.value}
                                        className="flex items-start gap-3 rounded-lg border p-3 font-normal"
                                    >
                                        <RadioGroupItem value={option.value} className="mt-0.5"/>
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
                        </div>

                        {activeConfig?.mode === "curated" &&
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <Label htmlFor="highlighted-media-search">
                                        Add Media
                                    </Label>
                                    <Input
                                        id="highlighted-media-search"
                                        value={search}
                                        inputMode="search"
                                        onChange={(ev) => setSearch(ev.target.value)}
                                        placeholder={activeTab === "overview" ? "Search your lists..." : `Search your ${activeTab} list...`}
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        Search only uses your local list data. Overview can mix media types.
                                    </p>
                                    {debouncedSearch.trim().length >= 2 &&
                                        <div className="rounded-lg border">
                                            {isSearching &&
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    Searching your list...
                                                </div>
                                            }
                                            {!isSearching && searchResults?.length === 0 &&
                                                <div className="p-3 text-sm text-muted-foreground">
                                                    No matching media found in your list.
                                                </div>
                                            }
                                            {!isSearching && (searchResults?.length ?? 0) > 0 &&
                                                <div className="divide-y">
                                                    {searchResults?.map((item) => {
                                                        const isSelected = selectedKeys.has(toItemKey(item));
                                                        const isAtLimit = activeConfig.items.length >= PROFILE_MAX_HIGHLIGHTED_MEDIA;

                                                        return (
                                                            <div key={toItemKey(item)} className="flex items-center gap-3 p-3">
                                                                <img
                                                                    src={item.mediaCover}
                                                                    alt={item.mediaName}
                                                                    className="h-14 w-10 rounded object-cover"
                                                                />
                                                                <div className="min-w-0 flex-1">
                                                                    <div className="line-clamp-1 font-medium">{item.mediaName}</div>
                                                                    <div className="text-xs text-muted-foreground">
                                                                        {capitalize(item.mediaType)}
                                                                    </div>
                                                                </div>
                                                                <Button
                                                                    type="button"
                                                                    size="sm"
                                                                    variant="outline"
                                                                    disabled={isSelected || isAtLimit}
                                                                    onClick={() => handleAddItem(item)}
                                                                >
                                                                    {isSelected ? "Added" : "Add"}
                                                                </Button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            }
                                        </div>
                                    }
                                </div>

                                <div className="space-y-3">
                                    <div>
                                        <Label>Curated Items</Label>
                                        <p className="text-xs text-muted-foreground">
                                            Up to {PROFILE_MAX_HIGHLIGHTED_MEDIA} items. Use arrows to control order.
                                        </p>
                                    </div>

                                    {activeConfig.items.length === 0 ?
                                        <div className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                                            No media selected yet.
                                        </div>
                                        :
                                        <div className="space-y-2">
                                            {activeConfig.items.map((item, index) => {
                                                const searchItem = previewCache[toItemKey(item)] ?? searchResults?.find((result) => toItemKey(result) === toItemKey(item));

                                                return (
                                                    <CuratedItemRow
                                                        item={item}
                                                        index={index}
                                                        preview={searchItem}
                                                        onMove={handleMoveItem}
                                                        onRemove={handleRemoveItem}
                                                        total={activeConfig.items.length}
                                                        key={`${toItemKey(item)}-${index}`}
                                                    />
                                                );
                                            })}
                                        </div>
                                    }
                                </div>
                            </div>
                        }

                        {rootError &&
                            <p className="text-sm font-medium text-destructive">
                                {rootError}
                            </p>
                        }

                        <Button type="button" disabled={!isDirty || mutation.isPending} onClick={handleSave}>
                            {mutation.isPending ? "Saving..." : "Save Customization"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
};


interface CuratedItemRowProps {
    index: number;
    total: number;
    item: HighlightedMediaSettings[HighlightedMediaTab]["items"][number];
    preview?: HighlightedMediaSearchItem;
    onRemove: (index: number) => void;
    onMove: (index: number, direction: -1 | 1) => void;
}


const CuratedItemRow = ({ index, total, item, preview, onMove, onRemove }: CuratedItemRowProps) => {
    return (
        <div className="flex items-center gap-3 rounded-lg border p-3">
            <div className="flex h-14 w-10 items-center justify-center rounded bg-accent text-xs text-muted-foreground">
                {index + 1}
            </div>
            <div className="min-w-0 flex-1">
                <div className="line-clamp-1 font-medium">
                    {preview?.mediaName ?? `Media #${item.mediaId}`}
                </div>
                <div className="text-xs text-muted-foreground">
                    {capitalize(item.mediaType)}
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Button type="button" size="sm" variant="outline" disabled={index === 0} onClick={() => onMove(index, -1)}>
                    <ArrowUp/>
                </Button>
                <Button type="button" size="sm" variant="outline" disabled={index === total - 1} onClick={() => onMove(index, 1)}>
                    <ArrowDown/>
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={() => onRemove(index)}>
                    <Trash2/>
                </Button>
            </div>
        </div>
    );
};


const cloneSettings = (settings: HighlightedMediaSettings) => {
    return JSON.parse(JSON.stringify(settings)) as HighlightedMediaSettings;
};


const toItemKey = (item: { mediaId: number; mediaType: string }) => `${item.mediaType}-${item.mediaId}`;


const buildPreviewCache = (previews: Record<string, { items: HighlightedMediaSearchItem[] }>) => {
    return Object.values(previews).reduce<Record<string, HighlightedMediaSearchItem>>((acc, tabPreview) => {
        tabPreview.items.forEach((item) => {
            acc[toItemKey(item)] = item;
        });
        return acc;
    }, {});
};
