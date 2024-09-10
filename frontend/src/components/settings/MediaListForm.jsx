import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/hooks/AuthHook";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {FaQuestionCircle} from "react-icons/fa";
import {simpleMutations} from "@/api/mutations/simpleMutations.js";
import {Separator} from "@/components/ui/separator";
import {LuDownload, LuLoader2} from "react-icons/lu";
import {FormError} from "@/components/app/base/FormError";
import {downloadFile, jsonToCsv} from "@/utils/functions";
import {FormButton} from "@/components/app/base/FormButton";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const MediaListForm = () => {
    const form = useForm();
    const { currentUser, setCurrentUser } = useAuth();
    const { listSettings, downloadListAsCSV } = simpleMutations();
    const [errorMessage, setErrorMessage] = useState("");
    const [selectedList, setSelectedList] = useState("");

    const onSubmit = (submitData) => {
        setErrorMessage("");

        listSettings.mutate(submitData, {
            onError: (error) => setErrorMessage(error.description),
            onSuccess: (data) => {
                setCurrentUser(data);
                toast.success("Settings successfully updated");
            }
        });
    };

    const handleDownloadCSV = async (ev) => {
        ev.preventDefault();

        downloadListAsCSV.mutate({ selectedList }, {
            onError: (error) => setErrorMessage(error.description),
            onSuccess: (data) => {
                try {
                    const formattedData = jsonToCsv(data);
                    downloadFile(formattedData, selectedList, "text/csv");
                }
                catch {
                    toast.error("An error occurred while downloading the CSV");
                }
            }
        });
    };

    const userMediaLists = [
        { label: "SeriesList", value: "series" },
        { label: "AnimeList", value: "anime" },
        { label: "MoviesList", value: "movies" },
        { label: "GamesList", value: "games" },
        { label: "BooksList", value: "books" },
    ];

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full space-y-8">
                    {errorMessage && <FormError message={errorMessage}/>}
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            Activate Lists Type
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="add_anime"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            defaultChecked={currentUser.settings.anime.active}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate anime list</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="add_games"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            defaultChecked={currentUser.settings.games.active}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate games list</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="add_books"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            defaultChecked={currentUser.settings.books.active}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>&nbsp; Activate books list</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            <div className="flex items-center gap-3">
                                <div>Rating System</div>
                                <Popover>
                                    <PopoverTrigger className="opacity-50 hover:opacity-80">
                                        <FaQuestionCircle size={16}/>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        Switch between a numerical rating on a scale of 0 to 10 (steps of 0.5)
                                        to an emoticon-based rating (5 levels) to convey your liking or disliking of a
                                        media.
                                    </PopoverContent>
                                </Popover>
                            </div>
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="add_feeling"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            defaultChecked={currentUser.add_feeling}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>Score (unchecked) or Feeling (checked)</FormLabel>
                                    </div>
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
                            name="grid_list_view"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                            defaultChecked={currentUser.grid_list_view}
                                        />
                                    </FormControl>
                                    <div className="leading-none">
                                        <FormLabel>Grid Mode (checked) or Table mode (unchecked)</FormLabel>
                                    </div>
                                </FormItem>
                            )}
                        />
                    </div>
                    <FormButton className="mt-5" disabled={listSettings.isPending}>
                        Update
                    </FormButton>
                </form>
            </Form>
            <div className="mt-8 space-y-4 w-[400px] max-sm:w-full bg-neutral-900 p-3 rounded-lg">
                <h3 className="text-base font-medium">
                    Export Your Lists As CSV
                    <Separator/>
                </h3>
                <div className="flex gap-4">
                    <Select onValueChange={setSelectedList} value={selectedList}>
                        <SelectTrigger className="w-[140px] border">
                            <SelectValue placeholder="Select a list"/>
                        </SelectTrigger>
                        <SelectContent className="w-[140px]">
                            {userMediaLists.map(({ label, value }) =>
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleDownloadCSV} disabled={!selectedList || listSettings.isPending}>
                        {listSettings.isPending ?
                            <LuLoader2 className="mr-2 h-4 w-4 animate-spin"/>
                            :
                            <LuDownload className="mr-2 h-4 w-4"/>
                        }
                        Download CSV
                    </Button>
                </div>
            </div>
        </div>
    );
};
