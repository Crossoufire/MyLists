import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {genericMutations} from "@/api/mutations.js";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const PasswordForm = () => {
    const { setCurrentUser } = useAuth();
    const { passwordSettings } = genericMutations();
    const [errors, setErrors] = useState("");
    const form = useForm({
        defaultValues: {
            current_password: "",
            new_password: "",
            confirm_new_password: "",
        },
    });

    const onSubmit = async (data) => {
        setErrors("");
        delete data.confirm_new_password;

        passwordSettings.mutate(data, {
            onError: (error) => setErrors(error.description),
            onSuccess: (data) => {
                setCurrentUser(data.updated_user);
                toast.success("Settings successfully updated");
            }
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full">
                <div className="space-y-5">
                    {errors && <FormError message={errors}/>}
                    <FormField
                        control={form.control}
                        name="current_password"
                        render={({ field }) => (
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
                        rules={{ minLength: { value: 8, message: "The new password must have at least 8 characters" } }}
                        render={({ field }) => (
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
                <FormButton className="mt-5" disabled={passwordSettings.isPending}>
                    Update
                </FormButton>
            </form>
        </Form>
    );
};
