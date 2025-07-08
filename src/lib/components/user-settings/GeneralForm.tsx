import {toast} from "sonner";
import {CircleHelp} from "lucide-react";
import {useForm} from "react-hook-form";
import {useEffect, useState} from "react";
import {useAuth} from "@/lib/hooks/use-auth";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {PrivacyType} from "@/lib/server/utils/enums";
import {ImageCropper} from "@/lib/components/user-settings/ImageCropper";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {useGeneralSettingsMutation} from "@/lib/react-query/query-mutations/user.mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


type FormValues = {
    username: string;
    profileImage?: File;
    privacy: PrivacyType;
    backgroundImage?: File;
};


export const GeneralForm = () => {
    const { currentUser, setCurrentUser } = useAuth();
    const generalSettingsMutation = useGeneralSettingsMutation();
    const [imageCropperKey, setImageCropperKey] = useState(Date.now());
    const form = useForm<FormValues>({
        defaultValues: {
            profileImage: undefined,
            backgroundImage: undefined,
            username: currentUser?.name ?? "",
            privacy: currentUser?.privacy ?? PrivacyType.RESTRICTED,
        },
    });

    useEffect(() => {
        if (currentUser) {
            form.reset({
                username: currentUser.name,
                privacy: currentUser.privacy as PrivacyType,
            });
        }
    }, [currentUser, form]);

    const onSubmit = async (submittedData: FormValues) => {
        const formData = new FormData();

        Object.entries(submittedData).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                formData.append(key, value);
            }
        });

        generalSettingsMutation.mutate({ data: formData }, {
            onError: (error: any) => {
                if (error?.name === "ZodError" && error?.issues && Array.isArray(error.issues)) {
                    error.issues.forEach((issue: any) => {
                        form.setError(issue.path[0], { type: "server", message: issue.message });
                    });
                }
                else if (error?.message?.includes("Username invalid")) {
                    form.setError("username", { type: "server", message: error.message });
                }
                else {
                    const message = error?.message || "An unexpected error occurred.";
                    form.setError("root", { type: "server", message: message });
                }
            },
            onSuccess: async () => {
                await setCurrentUser();
                setImageCropperKey(Date.now());
                form.resetField("profileImage");
                form.resetField("backgroundImage");
                toast.success("Settings successfully updated");
            },
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
                            required: { value: true, message: "Username is required." },
                            minLength: { value: 3, message: "Username too short (3 min)." },
                            maxLength: { value: 15, message: "Username too long (15 max)." },
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
                                        <SelectTrigger className="w-full">
                                            <SelectValue placeholder="Select a privacy mode"/>
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value={PrivacyType.PUBLIC}>Public</SelectItem>
                                        <SelectItem value={PrivacyType.RESTRICTED}>Restricted</SelectItem>
                                        <SelectItem value={PrivacyType.PRIVATE} disabled>Private</SelectItem>
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
                                        key={imageCropperKey}
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
                                        key={imageCropperKey + 1}
                                        onCropApplied={field.onChange}
                                        resultClassName={"h-[100px] object-contain"}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />
                </div>
                {form.formState.errors.root && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                        {form.formState.errors.root.message}
                    </p>
                )}
                <Button type="submit" className="mt-5" disabled={!form.formState.isDirty || generalSettingsMutation.isPending}>
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
                    Determine who can see your profile, lists, stats, media updates, etc...
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
