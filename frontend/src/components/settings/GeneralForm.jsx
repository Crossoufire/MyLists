import {toast} from "sonner";
import React, {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {LuHelpCircle} from "react-icons/lu";
import {FormButton} from "@/components/app/base/FormButton";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const GeneralForm = () => {
    const { generalSettings } = simpleMutations();
    const { currentUser, setCurrentUser } = useAuth();
    const [profileImage, setProfileImage] = useState("");
    const [backgroundImage, setBackgroundImage] = useState("");
    const form = useForm({
        defaultValues: {
            username: currentUser.username,
            privacy: currentUser.privacy,
        }
    });

    const onSubmit = async (data) => {
        if (data.username === currentUser.username) {
            delete data.username;
        }

        const formData = new FormData();
        Object.keys(data).forEach(key => {
            if (data[key] === undefined) return;
            if (key === "profile_image" || key === "background_image") {
                formData.append(key, data[key][0]);
            }
            else {
                formData.append(key, data[key]);
            }
        });

        generalSettings.mutate({ data: formData }, {
            onError: (error) => {
                if (error?.errors?.form?.username) {
                    return form.setError("username", { type: "manual", message: error.errors.form.username[0] });
                }
                toast.error(error.description);
            },
            onSuccess: (data) => {
                setCurrentUser(data);
                toast.success("Settings successfully updated");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full">
                <div className="space-y-5">
                    <FormField
                        control={form.control}
                        name="username"
                        rules={{
                            minLength: { value: 3, message: "The username is too short (3 min)." },
                            maxLength: { value: 15, message: "The username is too long (15 max)." },
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Username</FormLabel>
                                <FormControl>
                                    <Input
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="privacy"
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>
                                    <div className="flex items-center gap-2">
                                        Privacy
                                        <PrivacyPopover/>
                                    </div>
                                </FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger className="border ">
                                            <SelectValue placeholder="Select a privacy mode"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="public">Public</SelectItem>
                                        <SelectItem value="restricted">Restricted</SelectItem>
                                        <SelectItem value="private" disabled>Private</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
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
                                        value={backgroundImage}
                                        onChange={(ev) => {
                                            setBackgroundImage(ev.target.value);
                                            field.onChange(ev.target.files);
                                        }}
                                        className="file:text-muted-foreground cursor-pointer"
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <FormButton className="mt-5" disabled={generalSettings.isPending || !form.formState.isDirty}>
                    Update
                </FormButton>
            </form>
        </Form>
    );
};


const PrivacyPopover = () => {
    return (
        <Popover>
            <PopoverTrigger>
                <LuHelpCircle/>
            </PopoverTrigger>
            <PopoverContent className="p-5 w-80">
                <div className="mb-3 text-sm font-medium text-muted-foreground">
                    Determine who can see your profile, lists, stats, and media updates.
                </div>
                <ul className="text-sm list-disc space-y-3 pl-4">
                    <li>
                        <span className="font-semibold text-green-500">Public:</span>
                        {" "}Anyone can see your profile, lists, stats, and media updates.
                    </li>
                    <li>
                        <span className="font-semibold text-amber-500">Restricted (default):</span>
                        {" "}Only logged-in users can see your profile, lists, stats, and media updates.
                    </li>
                    <li>
                        <span className="font-semibold text-red-500">Private (not implemented yet):</span>
                        {" "}Only approved followers can see your profile, lists, stats, and media updates.
                    </li>
                </ul>
            </PopoverContent>
        </Popover>
    );
};