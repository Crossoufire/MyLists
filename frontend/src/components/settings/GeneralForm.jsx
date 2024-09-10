import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const GeneralForm = () => {
    const form = useForm();
    const { generalSettings } = simpleMutations();
    const { currentUser, setCurrentUser } = useAuth();
    const [errorMessage, setErrorMessage] = useState("");
    const [profileImage, setProfileImage] = useState("");
    const [backgroundImage, setBackgroundImage] = useState("");

    const onSubmit = async (data) => {
        setErrorMessage("");

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
            onError: (error) => setErrorMessage(error.description),
            onSuccess: (data) => {
                setCurrentUser(data);
                toast.success("Settings successfully updated");
            },
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full">
                <div className="space-y-5">
                    {errorMessage && <FormError message={errorMessage}/>}
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
                                        defaultValue={currentUser.username}
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
                <FormButton className="mt-5" disabled={generalSettings.isPending}>
                    Update
                </FormButton>
            </form>
        </Form>
    );
};
