import {toast} from "sonner";
import {useState} from "react";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {useUser} from "@/providers/UserProvider";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const PasswordForm = () => {
    const form = useForm();
    const { setCurrentUser } = useUser();
    const [errors, setErrors] = useState("");
    const [pending, setPending] = useState(false);

    const onSubmit = async (data) => {
        setErrors("");

        try {
            setPending(true);
            const response = await api.post("/settings/password", data);

            if (!response.ok) {
                return setErrors(response.body.description);
            }

            setCurrentUser(response.body.updated_user);
            toast.success("Password successfully updated");
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
                    <FormField
                        control={form.control}
                        name="new_password"
                        rules={{ minLength: { value: 8, message: "The new password must have at least 8 characters"} }}
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
                </div>
                <FormButton className="mt-5" disabled={pending}>
                    Update
                </FormButton>
            </form>
        </Form>
    );
};
