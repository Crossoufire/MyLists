import {toast} from "sonner";
import {useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {Button} from "@/lib/components/ui/button";
import {Switch} from "@/lib/components/ui/switch";
import {useForm, useWatch} from "react-hook-form";
import {CircleHelp, Download} from "lucide-react";
import {Separator} from "@/lib/components/ui/separator";
import {ListSettings} from "@/lib/server/types/base.types";
import {capitalize, downloadFile, jsonToCsv} from "@/lib/utils/functions";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {ApiProviderType, MediaType, RatingSystemType} from "@/lib/server/utils/enums";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";
import {useDownloadListAsCSVMutation, useListSettingsMutation} from "@/lib/react-query/query-mutations/user.mutations";


const mediaTypeConfigs = [
    {
        label: "Anime",
        name: MediaType.ANIME,
    },
    {
        label: "Games",
        name: MediaType.GAMES,
        apiProvider: ApiProviderType.IGDB,
    },
    {
        label: "Books",
        name: MediaType.BOOKS,
        apiProvider: ApiProviderType.BOOKS,
    },
    {
        label: "Manga",
        name: MediaType.MANGA,
        apiProvider: ApiProviderType.MANGA,
    },
];


export const MediaListForm = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const listSettingsMutation = useListSettingsMutation();
    const downloadListAsCSVMutation = useDownloadListAsCSVMutation();
    const [selectedListForExport, setSelectedListForExport] = useState<MediaType | "">("");
    const form = useForm<ListSettings>({
        values: {
            gridListView: currentUser?.gridListView ?? true,
            ratingSystem: currentUser?.ratingSystem ?? RatingSystemType.SCORE,
            searchSelector: currentUser?.searchSelector ?? ApiProviderType.TMDB,
            [MediaType.ANIME]: currentUser?.settings.find(s => s.mediaType === MediaType.ANIME)?.active ?? false,
            [MediaType.GAMES]: currentUser?.settings.find(s => s.mediaType === MediaType.GAMES)?.active ?? false,
            [MediaType.BOOKS]: currentUser?.settings.find(s => s.mediaType === MediaType.BOOKS)?.active ?? false,
            [MediaType.MANGA]: currentUser?.settings.find(s => s.mediaType === MediaType.MANGA)?.active ?? false,
        }
    });

    const isGamesActive = useWatch({ control: form.control, name: MediaType.GAMES });
    const isBooksActive = useWatch({ control: form.control, name: MediaType.BOOKS });
    const isMangaActive = useWatch({ control: form.control, name: MediaType.MANGA });
    
    const handleCheckedChange = (field: any, checked: boolean, apiProvider?: ApiProviderType) => {
        field.onChange(checked);
        if (!checked && apiProvider && form.getValues("searchSelector") === apiProvider) {
            form.setValue("searchSelector", ApiProviderType.TMDB, { shouldDirty: true });
        }
    };

    const onSubmit = (submittedData: ListSettings) => {
        listSettingsMutation.mutate({ data: submittedData }, {
            onError: () => toast.error("An error occurred while updating the data"),
            onSuccess: async () => {
                await setCurrentUser();
                toast.success("Settings successfully updated");
            }
        });
    };

    const handleDownloadCSV = async (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();

        downloadListAsCSVMutation.mutate({ selectedList: selectedListForExport }, {
            onError: () => toast.error("An error occurred querying the CSV data"),
            onSuccess: (data) => {
                try {
                    const formattedData = jsonToCsv(data as any);
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
                    <div className="space-y-3">
                        <h3 className="text-base font-medium">
                            Activate List Types
                        </h3>
                        <Separator/>
                        {mediaTypeConfigs.map((config) => (
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
                                                onCheckedChange={(checked) => handleCheckedChange(field, checked, config.apiProvider)}
                                            />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        ))}
                    </div>
                    <div>
                        <FormField
                            name="searchSelector"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Navbar Search Selector
                                        <SearchPopover/>
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="w-full">
                                                <SelectValue placeholder="Select a search selector"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value={ApiProviderType.TMDB}>Media</SelectItem>
                                            <SelectItem value={ApiProviderType.BOOKS} disabled={!isBooksActive}>Books</SelectItem>
                                            <SelectItem value={ApiProviderType.IGDB} disabled={!isGamesActive}>Games</SelectItem>
                                            <SelectItem value={ApiProviderType.MANGA} disabled={!isMangaActive}>Manga</SelectItem>
                                            <SelectItem value={ApiProviderType.USERS}>Users</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div>
                        <FormField
                            name="ratingSystem"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        Rating System
                                        <RatingSystemPopover/>
                                    </FormLabel>
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
                    <div>
                        <FormField
                            name="gridListView"
                            control={form.control}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>List View Mode</FormLabel>
                                    <Select onValueChange={field.onChange} value={field.value ? "grid" : "table"}>
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
                <h3 className="text-base font-medium">Export Your List as CSV</h3>
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


const SearchPopover = () => {
    return (
        <Popover>
            <PopoverTrigger className="opacity-50 hover:opacity-80">
                <CircleHelp className="w-4 h-4"/>
            </PopoverTrigger>
            <PopoverContent className="p-5 w-80">
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                    Select your preferred navbar search selector.
                </div>
                <ul className="text-sm list-disc space-y-3 pl-4">
                    <li>
                        <span className="font-semibold">Media (default):</span>
                        {" "}Corresponds to Series, Anime and Movies.
                    </li>
                    <li>
                        <span className="font-semibold">Games/Books/Manga:</span>
                        {" "}Corresponds to their respective type. Requires the corresponding list
                        to be activated.
                    </li>
                </ul>
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
