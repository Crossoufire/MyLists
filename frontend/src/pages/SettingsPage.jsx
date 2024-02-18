import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Switch} from "@/components/ui/switch";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {FaQuestionCircle} from "react-icons/fa";
import {useUser} from "@/providers/UserProvider";
import {useCollapse} from "@/hooks/CollapseHook";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {FormError} from "@/components/homepage/FormError";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
    AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger} from "@/components/ui/alert-dialog";


export const SettingsPage = () => {
    const api = useApi();
    const form = useForm();
    const [errors, setErrors] = useState({});
    const [backImage, setBackImage] = useState("");
    const [sending, setIsSending] = useState(false);
    const [profileImage, setProfileImage] = useState("");
    const {currentUser, setCurrentUser, logout} = useUser();
    const {isOpen, caret, toggleCollapse} = useCollapse(false);

    const apiCall = async (formData) => {
        let response;

        try {
            let body = {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${localStorage.getItem("accessToken")}`,
                },
                body: formData,
            }
            response = await fetch(`${import.meta.env.VITE_BASE_API_URL}/api/update_settings`, body);
        }
        catch (error) {
            response = {
                ok: false,
                status: 500,
                json: async () => {
                    return {
                        code: 500,
                        message: "Internal Server Error",
                        description: error.toString(),
                    };
                }
            };
        }

        return {
            ok: response.ok,
            status: response.status,
            body: response.status !== 204 ? await response.json() : null,
        }
    }

    const onSubmit = async (data) => {
        setErrors({});
        setIsSending(true);

        const formData = new FormData();

        Object.keys(data).forEach(key => {
            if (data[key] === undefined) {
                return;
            }

            if (key === "profile_image" || key === "background_image") {
                formData.append(key, data[key][0]);
            }
            else {
                formData.append(key, data[key]);
            }
        });

        const response = await apiCall(formData);

        setIsSending(false);

        if (!response.ok) {
            toast.error("An error occurred in the submitted form.");
            return setErrors(response.body.description);
        }

        setCurrentUser(response.body.updated_user);
        toast.success(response.body.message);
    };

    const handleDeleteAccount = async () => {
        const confirm = window.confirm("Are you *REALLY* sure?");

        if (confirm) {
            const response = await api.post("/delete_account");

            if (!response.ok) {
                return toast.error(response.body.description);
            }

            toast.success(response.body.message);
            logout();
        }
    };

    return (
        <PageTitle title="Your Settings" subtitle="Customize Your Profile: Manage Your Preferences and Account Settings">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 w-[500px] max-sm:w-full">
                    <div className="space-y-6">
                        <div className="space-y-3 bg-card p-5 pt-3 rounded-md">
                            <h3 className="text-lg font-medium">
                                General <Separator/>
                            </h3>
                            <FormField
                                control={form.control}
                                name="username"
                                rules={{
                                    minLength: {value: 3, message: "The username is too short (3 min)"},
                                    maxLength: {value: 15, message: "The username is too long (15 max)"},
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                defaultValue={currentUser.username}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {errors?.username && <FormError message={errors.username}/>}
                            <FormField
                                control={form.control}
                                name="profile_image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Profile image</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="file"
                                                value={profileImage}
                                                onChange={(ev) => {
                                                    setProfileImage(ev.target.value);
                                                    field.onChange(ev.target.files);
                                                }}
                                                className="file:text-muted-foreground cursor-pointer"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {errors?.profile_image && <FormError message={errors.profile_image}/>}
                            <FormField
                                control={form.control}
                                name="background_image"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Background Image</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="file"
                                                value={backImage}
                                                onChange={(ev) => {
                                                    setBackImage(ev.target.value);
                                                    field.onChange(ev.target.files);
                                                }}
                                                className="file:text-muted-foreground cursor-pointer"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {errors?.background_image && <FormError message={errors.background_image}/>}
                        </div>
                        <div className="space-y-3 bg-card p-5 pt-3 rounded-md">
                            <h3 className="text-lg font-medium">
                                Activate other list <Separator/>
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
                                                defaultChecked={currentUser.add_anime}
                                            />
                                        </FormControl>
                                        <div className="leading-none">
                                            <FormLabel>&nbsp; Activate anime list</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            {errors?.add_anime && <FormError message={errors.add_anime}/>}
                            <FormField
                                control={form.control}
                                name="add_games"
                                render={({field}) => (
                                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                defaultChecked={currentUser.add_games}
                                            />
                                        </FormControl>
                                        <div className="leading-none">
                                            <FormLabel>&nbsp; Activate games list</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            {errors?.add_games && <FormError message={errors.add_games}/>}
                            <FormField
                                control={form.control}
                                name="add_books"
                                render={({field}) => (
                                    <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                        <FormControl>
                                            <Switch
                                                checked={field.value}
                                                onCheckedChange={field.onChange}
                                                defaultChecked={currentUser.add_books}
                                            />
                                        </FormControl>
                                        <div className="leading-none">
                                            <FormLabel>&nbsp; Activate books list</FormLabel>
                                        </div>
                                    </FormItem>
                                )}
                            />
                            {errors?.add_books && <FormError message={errors.add_books}/>}
                        </div>
                        <div className="space-y-3 bg-card p-5 pt-3 rounded-md">
                            <h3 className="text-lg font-medium">
                                Change rating system
                                <Popover>
                                    <PopoverTrigger className="ml-2">
                                        <FaQuestionCircle size={14}/>
                                    </PopoverTrigger>
                                    <PopoverContent>
                                        Switch between a numerical rating on a scale of 0 to 10 (steps of 0.5)
                                        to an emoticon-based rating to convey your liking or disliking of a media.
                                    </PopoverContent>
                                </Popover>
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
                            {errors?.add_feeling && <FormError message={errors.add_feeling}/>}
                        </div>
                        <div className="space-y-3 bg-card p-5 pt-3 rounded-md">
                            <h3 className="text-lg font-medium">
                                Change your password <Separator/>
                            </h3>
                            <FormField
                                control={form.control}
                                name="current_password"
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Current Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder="********"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {errors?.current_password && <FormError message={errors.current_password}/>}
                            <FormField
                                control={form.control}
                                name="new_password"
                                rules={{ minLength: {value: 8, message: "The new password must have at least 8 characters"} }}
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder="********"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {errors?.new_password && <FormError message={errors.new_password}/>}
                            <FormField
                                control={form.control}
                                name="confirm_new_password"
                                rules={{
                                    validate: (val) => {
                                        // noinspection JSCheckFunctionSignatures
                                        if (form.watch("new_password") !== val) {
                                            return "The passwords do not match";
                                        }
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm New Password</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                type="password"
                                                placeholder="********"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {errors?.confirm_new_password && <FormError message={errors.confirm_new_password}/>}
                        </div>
                    </div>
                    <Button type="submit" className="mt-6" disabled={sending}>
                        {sending ? "Loading..." : "Update your settings"}
                    </Button>
                </form>
            </Form>
            <div className="mt-8 w-[500px] max-sm:w-full">
                <div role="button" onClick={toggleCollapse} className="flex items-center gap-2 text-destructive
                font-semibold text-lg">
                    {caret} Danger Zone
                </div>
                <Separator/>
                {isOpen &&
                    <AlertDialog>
                        <AlertDialogTrigger asChild className="mx-auto">
                            <Button variant="destructive">
                                DELETE MY ACCOUNT (DEFINITIVE!)
                            </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Are you REALLY sure?</AlertDialogTitle>
                                <Separator/>
                                <AlertDialogDescription className="text-primary text-base">
                                    This will DEFINITIVELY delete your account and all its data.
                                    This action is irreversible.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={handleDeleteAccount}>
                                    Delete my account
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                }
            </div>
        </PageTitle>
    );
};


