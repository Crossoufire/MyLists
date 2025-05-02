import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/lib/hooks/use-auth";
import {Button} from "@/lib/components/ui/button";
import {Switch} from "@/lib/components/ui/switch";
import {CircleHelp, Download} from "lucide-react";
import {Separator} from "@/lib/components/ui/separator";
import {capitalize, downloadFile, jsonToCsv} from "@/lib/utils/functions";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {ApiProviderType, MediaType, RatingSystemType} from "@/lib/server/utils/enums";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";
import {useDownloadListAsCSVMutation, useListSettingsMutation} from "@/lib/react-query/query-mutations/user.mutations";


interface MediaTypeToggleConfig {
    label: string;
    mediaType: MediaType;
    searchSelector?: ApiProviderType;
    name: "addAnime" | "addGames" | "addBooks" | "addManga";
}


const mediaTypeToggles: MediaTypeToggleConfig[] = [
    {
        label: "Anime",
        name: "addAnime",
        mediaType: MediaType.ANIME,
    },
    {
        label: "Games",
        name: "addGames",
        mediaType: MediaType.GAMES,
        searchSelector: ApiProviderType.IGDB,
    },
    {
        label: "Books",
        name: "addBooks",
        mediaType: MediaType.BOOKS,
        searchSelector: ApiProviderType.BOOKS,
    },
    {
        label: "Manga",
        name: "addManga",
        mediaType: MediaType.MANGA,
        searchSelector: ApiProviderType.MANGA,
    },
];


export const MediaListForm = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const listSettingsMutation = useListSettingsMutation();
    const downloadListAsCSVMutation = useDownloadListAsCSVMutation();
    const [selectedListForExport, setSelectedListForExport] = useState<MediaType | "">("");
    const form = useForm({
        defaultValues: {
            ratingSystem: currentUser?.ratingSystem,
            searchSelector: currentUser?.searchSelector,
            addAnime: currentUser?.settings.find(s => s.mediaType === MediaType.ANIME)?.active,
            addGames: currentUser?.settings.find(s => s.mediaType === MediaType.GAMES)?.active,
            addBooks: currentUser?.settings.find(s => s.mediaType === MediaType.BOOKS)?.active,
            addManga: currentUser?.settings.find(s => s.mediaType === MediaType.MANGA)?.active,
            gridListView: currentUser?.gridListView === true ? "grid" : "table",
        }
    });

    const onSubmit = (submittedData: any) => {
        const mutationPayload = {
            ...submittedData,
            gridListView: (submittedData.gridListView === "grid"),
        };

        listSettingsMutation.mutate({ data: mutationPayload }, {
            onError: () => toast.error("An error occurred while updating the data"),
            onSuccess: async () => {
                await setCurrentUser();
                toast.success("Settings successfully updated");
            }
        });
    };

    const isListActive = (fieldName: keyof typeof form.control._defaultValues) => {
        return form.watch(fieldName) === true;
    };

    const onListActivationChanged = (field: any, value: boolean, config: MediaTypeToggleConfig) => {
        field.onChange(value);
        const currentSearchSelector = form.watch("searchSelector");
        if (!value && config.searchSelector && currentSearchSelector === config.searchSelector) {
            form.setValue("searchSelector", ApiProviderType.TMDB, { shouldDirty: true });
        }
    };

    const handleDownloadCSV = async (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();

        downloadListAsCSVMutation.mutate({ selectedList: selectedListForExport }, {
            onError: () => toast.error("An error occurred querying the CSV data"),
            onSuccess: (data) => {
                try {
                    const formattedData = jsonToCsv(data);
                    downloadFile(formattedData, selectedListForExport, "text/csv");
                }
                catch {
                    toast.error("An error occurred while formatting the CSV");
                }
            }
        });
    };

    const mediaTypesForExport = Object.values(MediaType).map((mediaType) => ({
        label: `${capitalize(mediaType)} List`,
        value: mediaType,
    }));

    return (
        <div className="space-y-6">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">Activate List Types</h3>
                        <Separator/>
                        {mediaTypeToggles.map((config) => (
                            <FormField
                                key={config.name}
                                name={config.name}
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center justify-between space-x-3 rounded-md border p-3">
                                        <FormLabel className="font-normal">
                                            {config.label} List
                                        </FormLabel>
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={(checked) => onListActivationChanged(field, checked, config)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            <div className="flex items-center gap-2">
                                Navbar Search Selector
                                <TextPopover>
                                    Select your preferred navbar search selector. 'Media'
                                    corresponds to Series/Anime and Movies. Selecting
                                    Games/Books/Manga as default requires the corresponding list
                                    to be activated.
                                </TextPopover>
                            </div>
                        </h3>
                        <Separator/>
                        <FormField
                            name="searchSelector"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a search selector"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={ApiProviderType.TMDB}>Media</SelectItem>
                                            <SelectItem value={ApiProviderType.BOOKS} disabled={!isListActive("addBooks")}>Books</SelectItem>
                                            <SelectItem value={ApiProviderType.IGDB} disabled={!isListActive("addGames")}>Games</SelectItem>
                                            <SelectItem value={ApiProviderType.MANGA} disabled={!isListActive("addManga")}>Manga</SelectItem>
                                            <SelectItem value={ApiProviderType.USERS}>Users</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            <div className="flex items-center gap-2">
                                Rating System
                                <RatingSystemPopover/>
                            </div>
                        </h3>
                        <Separator/>
                        <FormField
                            name="ratingSystem"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a rating system"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={RatingSystemType.SCORE}>Score</SelectItem>
                                            <SelectItem value={RatingSystemType.FEELING}>Feeling</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">List View Mode</h3>
                        <Separator/>
                        <FormField
                            name="gridListView"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a view mode"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={"grid"}>Grid</SelectItem>
                                            <SelectItem value={"table"}>Table</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={listSettingsMutation.isPending}>
                        {listSettingsMutation.isPending ? "Updating..." : "Update Settings"}
                    </Button>
                </form>
            </Form>
            <Separator className="w-[400px] max-sm:w-full"/>
            <div className="w-[400px] max-sm:w-full space-y-4 rounded-lg border bg-card p-4 text-card-foreground shadow-sm">
                <h3 className="text-base font-medium">Export List as CSV</h3>
                <Separator/>
                <div className="flex flex-wrap items-end gap-3">
                    <div className="flex-grow">
                        <Select onValueChange={(value) => setSelectedListForExport(value as MediaType)} value={selectedListForExport}>
                            <SelectTrigger id="list-export-select">
                                <SelectValue placeholder="Select a list..."/>
                            </SelectTrigger>
                            <SelectContent>
                                {mediaTypesForExport.map(({ label, value }) => (
                                    <SelectItem key={value} value={value}>
                                        {label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                    <Button
                        variant="outline"
                        onClick={handleDownloadCSV}
                        disabled={!selectedListForExport || downloadListAsCSVMutation.isPending}
                    >
                        <Download className="mr-2 h-4 w-4"/>
                        {downloadListAsCSVMutation.isPending ? "Exporting..." : "Download CSV"}
                    </Button>
                </div>
                {downloadListAsCSVMutation.isError && (
                    <p className="text-sm text-destructive">Failed to export list. Please try again.</p>
                )}
            </div>
        </div>
    );
};


function TextPopover({ children }: { children: React.ReactNode }) {
    return (
        <Popover>
            <PopoverTrigger className="opacity-50 hover:opacity-80">
                <CircleHelp className="h-4 w-4"/>
            </PopoverTrigger>
            <PopoverContent>
                {children}
            </PopoverContent>
        </Popover>
    );
}


const RatingSystemPopover = () => {
    return (
        <Popover>
            <PopoverTrigger className="opacity-50 hover:opacity-80">
                <CircleHelp className="w-4 h-4"/>
            </PopoverTrigger>
            <PopoverContent className="p-5 w-80">
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                    Switch between two rating systems to rate your media.
                </div>
                <ul className="text-sm list-disc space-y-3 pl-4">
                    <li>
                        <span className="font-semibold">Score (default):</span>
                        {" "}Numerical rating from 0 to 10 in 0.5 increments (21 levels).
                    </li>
                    <li>
                        <span className="font-semibold">Feeling:</span>
                        {" "}Emoticon-based rating with 6 different levels.
                    </li>
                </ul>
            </PopoverContent>
        </Popover>
    );
};
