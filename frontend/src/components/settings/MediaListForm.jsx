import {toast} from "sonner";
import {useState} from "react";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {Button} from "@/components/ui/button";
import {Switch} from "@/components/ui/switch";
import {FaQuestionCircle} from "react-icons/fa";
import {useUser} from "@/providers/UserProvider";
import {Separator} from "@/components/ui/separator";
import {LuDownload, LuLoader2} from "react-icons/lu";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const MediaListForm = () => {
    const form = useForm();
    const { currentUser, setCurrentUser } = useUser();
    const [errors, setErrors] = useState("");
    const [isPending, setIsPending] = useState(false);
    const [selectedList, setSelectedList] = useState("");

    const onSubmit = async (data) => {
        setErrors("");

        try {
            setIsPending(true);
            const response = await api.post("/settings/medialist", data);

            if (!response.ok) {
                return setErrors(response.body.description);
            }

            setCurrentUser(response.body.updated_user);
            toast.success("Settings successfully updated");
        }
        finally {
            setIsPending(false);
        }
    };

    const handleDownloadCSV = async (ev) => {
        ev.preventDefault();

        try {
            setIsPending(true);
            const response = await api.get(`/settings/download/${selectedList}`);

            if (!response.ok) {
                return setErrors(response.body.description);
            }

            const formattedData = jsonToCsv(response.body.data);
            downloadFile(formattedData, selectedList, "text/csv");
        }
        catch {
            toast.error("An error occurred while downloading the CSV")
        }
        finally {
            setIsPending(false);
        }
    };

    const userMediaLists = [
        {label: "SeriesList", value: "series"},
        {label: "AnimeList", value: "anime"},
        {label: "MoviesList", value: "movies"},
        {label: "GamesList", value: "games"},
        {label: "BooksList", value: "books"},
    ];

    return (
        <div>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full space-y-8">
                    {errors && <FormError message={errors}/>}
                    <div className="space-y-4">
                        <h3 className="text-base font-medium">
                            Activate Lists Type
                            <Separator/>
                        </h3>
                        <FormField
                            control={form.control}
                            name="add_anime"
                            render={({field}) => (
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
                            render={({field}) => (
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
                            render={({field}) => (
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
                            render={({field}) => (
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
                    <FormButton className="mt-5" pending={isPending}>
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
                            {userMediaLists.map(({label, value}) =>
                                <SelectItem key={value} value={value}>{label}</SelectItem>
                            )}
                        </SelectContent>
                    </Select>
                    <Button onClick={handleDownloadCSV} disabled={!selectedList || isPending}>
                        {isPending?
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


function downloadFile(data, filename, mimeType) {
    const blob = new Blob([data], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}


function jsonToCsv(items) {
    if (!items || !items.length) return "";
    const header = Object.keys(items[0]);
    const headerString = header.join(",");
    const replacer = (key, value) => value ?? "";
    const rowItems = items.map(row =>
        header.map(fieldName => JSON.stringify(row[fieldName], replacer)).join(",")
    );
    return [headerString, ...rowItems].join("\r\n");
}
