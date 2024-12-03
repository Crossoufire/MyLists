import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {FormButton} from "@/components/app/FormButton";
import {simpleMutations} from "@mylists/api/mutations/simpleMutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const PasswordForm = () => {
    const { passwordSettings } = simpleMutations();
    const form = useForm({
        defaultValues: {
            new_password: "",
            current_password: "",
            confirm_new_password: "",
        },
    });

    const onSubmit = async (data) => {
        delete data.confirm_new_password;

        passwordSettings.mutate({ ...data }, {
            onError: (error) => {
                if (error?.errors?.json?.current_password) {
                    const message = error.errors.json.current_password[0];
                    return form.setError("current_password", { type: "manual", message });
                }
                toast.error("An error occurred while updating your password");
            },
            onSuccess: () => toast.success("Settings successfully updated"),
            onSettled: () => form.reset(),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full">
                <div className="space-y-5">
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
                        rules={{ minLength: { value: 8, message: "The new password must have at least 8 characters." } }}
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
                                    return "The passwords do not match.";
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
