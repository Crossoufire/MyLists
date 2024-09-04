import {toast} from "sonner";
import {useState} from "react";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {useUser} from "@/providers/UserProvider";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const GeneralForm = () => {
    const form = useForm();
    const { currentUser, setCurrentUser } = useUser();
    const [errors, setErrors] = useState("");
    const [pending, setPending] = useState(false);
    const [backImage, setBackImage] = useState("");
    const [profileImage, setProfileImage] = useState("");

    const onSubmit = async (data) => {
        setErrors("");

        try {
            setPending(true);

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

            const response = await api.post("/settings/general", formData, { removeContentType: true });
            if (!response.ok) {
                return setErrors(response.body.description);
            }

            setCurrentUser(response.body.updated_user);
            toast.success("Settings successfully updated");
        }
        finally {
            setPending(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full">
                <div className="space-y-5">
                    {errors && <FormError message={errors}/>}
                    <FormField
                        control={form.control}
                        name="username"
                        rules={{
                            minLength: {value: 3, message: "The username is too short (3 min)"},
                            maxLength: {value: 15, message: "The username is too long (15 max)"},
                        }}
                        render={({field}) => (
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
                        render={({field}) => (
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
                        render={({field}) => (
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
                </div>
                <FormButton className="mt-5" disabled={pending}>
                    Update
                </FormButton>
            </form>
        </Form>
    );
};
