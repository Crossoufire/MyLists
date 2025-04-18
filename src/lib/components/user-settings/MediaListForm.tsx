import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/lib/hooks/use-auth";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/components/ui/button";
import {Switch} from "@/lib/components/ui/switch";
import {CircleHelp, Download} from "lucide-react";
import {Separator} from "@/lib/components/ui/separator";
import {MediaType, RatingSystemType} from "@/lib/server/utils/enums";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


export const MediaListForm = () => {
    const { currentUser } = useAuth();
    // const listSettings = useListSettingsMutation();
    const [selectedListForExport, setSelectedListForExport] = useState("");
    // const downloadListAsCSV = useDownloadListAsCSVMutation();

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

    const watchAddBooks = form.watch("addBooks");
    const watchAddGames = form.watch("addGames");
    const watchAddManga = form.watch("addManga");

    const mediaTypesList = Object.values(MediaType).map(
        (mediaType) => ({ label: `${capitalize(mediaType)}List`, value: mediaType })
    );

    const onSubmit = (submittedData: any) => {
        const newData = { ...submittedData };
        newData.gridListView = (newData.gridListView === "grid");

        // listSettings.mutate({ ...newData }, {
        //     onError: () => toast.error("An error occurred while updating the data"),
        //     onSuccess: (data) => {
        //         setCurrentUser(data);
        //         toast.success("Settings successfully updated");
        //     }
        // });
    };

    const onListChanged = (field: any, check: boolean) => {
        field.onChange(check);
        const currentSearchSelector = form.getValues("searchSelector");

        if (!check) {
            if (field.name === "addGames" && currentSearchSelector === "igdb") {
                form.setValue("searchSelector", "tmdb", { shouldValidate: true });
            }
            else if (field.name === "addBooks" && currentSearchSelector === "books") {
                form.setValue("searchSelector", "tmdb", { shouldValidate: true });
            }
            else if (field.name === "addManga" && currentSearchSelector === "manga") {
                form.setValue("searchSelector", "tmdb", { shouldValidate: true });
            }
        }
    };

    const handleDownloadCSV = async (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();

        // downloadListAsCSV.mutate({ selectedList }, {
        //     onError: () => toast.error("An error occurred querying the CSV data"),
        //     onSuccess: (data) => {
        //         try {
        //             const formattedData = jsonToCsv(data);
        //             downloadFile(formattedData, selectedList, "text/csv");
        //         }
        //         catch {
        //             toast.error("An error occurred while formatting the CSV");
        //         }
        //     }
        // });
    };

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full space-y-8">
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            Activate Lists Type
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="addAnime"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={(checked) => onListChanged(field, checked)}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate anime list</FormLabel>
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addGames"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={(checked) => onListChanged(field, checked)}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate games list</FormLabel>
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addBooks"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={(checked) => onListChanged(field, checked)}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate books list</FormLabel>
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="addManga"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={(checked) => onListChanged(field, checked)}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate manga list</FormLabel>
                                    </div>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            <div className="flex items-center gap-2">
                                Navbar Search Selector
                                <TextPopover>
                                    Select your preferred navbar search selector.
                                    'Media' correspond to Series/Anime and Movies.
                                    Selecting Games/Books as default impose that your Games/Books list must be activated.
                                </TextPopover>
                            </div>
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="searchSelector"
                            render={({ field }) =>
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="border">
                                                <SelectValue placeholder="Select a search selector"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="tmdb">Media</SelectItem>
                                            <SelectItem value="books" disabled={!watchAddBooks}>Books</SelectItem>
                                            <SelectItem value="igdb" disabled={!watchAddGames}>Games</SelectItem>
                                            <SelectItem value="manga" disabled={!watchAddManga}>Manga</SelectItem>
                                            <SelectItem value="users">Users</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            }
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            <div className="flex items-center gap-2">
                                <div>Rating System</div>
                                <RatingSystemPopover/>
                            </div>
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="ratingSystem"
                            render={({ field }) => (
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="border">
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
                        <h3 className="text-base font-medium">
                            <div className="flex items-center gap-3">
                                <div>Lists View Mode</div>
                            </div>
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="gridListView"
                            render={({ field }) =>
                                <FormItem>
                                    <Select onValueChange={field.onChange} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="border">
                                                <SelectValue placeholder="Select a search selector"/>
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="grid">Grid</SelectItem>
                                            <SelectItem value="table">Table</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage/>
                                </FormItem>
                            }
                        />
                    </div>
                    <Button className="mt-3">
                        Update
                    </Button>
                </form>
            </Form>
            <Separator className="mt-4 w-[400px] max-sm:w-full"/>
            <div className="mt-4 space-y-4 w-[400px] max-sm:w-full bg-neutral-900 p-3 rounded-lg">
                <h3 className="text-base font-medium">
                    Export Your Lists As CSV
                    <Separator/>
                </h3>
                <div className="flex gap-4">
                    <Select onValueChange={setSelectedListForExport} value={selectedListForExport}>
                        <SelectTrigger className="w-[140px] border">
                            <SelectValue placeholder="Select a list"/>
                        </SelectTrigger>
                        <SelectContent className="w-[140px]">
                            {mediaTypesList.map(({ label, value }) =>
                                <SelectItem key={value} value={value}>
                                    {label}
                                </SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleDownloadCSV} disabled={!selectedListForExport}>
                        <Download className="mr-2 h-4 w-4"/> Download CSV
                    </Button>
                </div>
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
