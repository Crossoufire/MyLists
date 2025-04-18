import {CircleHelp} from "lucide-react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/lib/hooks/use-auth";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {ImageCropper} from "@/lib/components/user-settings/ImageCropper";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


export const GeneralForm = () => {
    const { currentUser } = useAuth();
    // const generalSettings = useGeneralSettingsMutation();
    const form = useForm({
        defaultValues: {
            profileImage: undefined,
            backgroundImage: undefined,
            username: currentUser?.name,
            privacy: currentUser?.privacy,
        }
    });

    const onSubmit = async (submittedData: any) => {
        if (submittedData.username.trim() === currentUser?.name.trim()) {
            delete submittedData.username;
        }

        const formData = new FormData();
        Object.keys(submittedData).forEach(key => {
            if (submittedData[key] === undefined) return;
            formData.append(key, submittedData[key]);
        });

        // generalSettings.mutate({ data: formData }, {
        //     onError: (error) => {
        //         if (error?.errors?.form?.username) {
        //             return form.setError("username", { type: "manual", message: error.errors.form.username[0] });
        //         }
        //         toast.error(error.description);
        //     },
        //     onSuccess: (data) => {
        //         setCurrentUser(data);
        //         toast.success("Settings successfully updated");
        //     },
        // });
    };

    return (
        <Form {...form} key={JSON.stringify(currentUser)}>
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
                                    <Input {...field}/>
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
                        name="profileImage"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Profile image</FormLabel>
                                <FormControl>
                                    <ImageCropper
                                        aspect={1}
                                        cropShape={"round"}
                                        fileName={field.name}
                                        onCropApplied={field.onChange}
                                        resultClassName="h-[150px] rounded-full"
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                    <FormField
                        name="backgroundImage"
                        control={form.control}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Background Image</FormLabel>
                                <FormControl>
                                    <ImageCropper
                                        cropShape={"rect"}
                                        aspect={1304 / 288}
                                        fileName={field.name}
                                        onCropApplied={field.onChange}
                                        resultClassName={"h-[100px] object-contain"}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                <Button className="mt-5" disabled={!form.formState.isDirty}>
                    Update
                </Button>
            </form>
        </Form>
    );
};


const PrivacyPopover = () => {
    return (
        <Popover>
            <PopoverTrigger className="opacity-50 hover:opacity-80">
                <CircleHelp className="w-4 h-4"/>
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
