import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {FormButton} from "@/components/app/base/FormButton";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const GeneralForm = () => {
    const { generalSettings } = simpleMutations();
    const { currentUser, setCurrentUser } = useAuth();
    const [profileImage, setProfileImage] = useState("");
    const [backgroundImage, setBackgroundImage] = useState("");
    const form = useForm({ defaultValues: { username: currentUser.username } });

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
                            minLength: { value: 3, message: "The username is too short (3 min)" },
                            maxLength: { value: 15, message: "The username is too long (15 max)" },
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
