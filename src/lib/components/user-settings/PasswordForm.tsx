import {useForm} from "react-hook-form";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";


export const PasswordForm = () => {
    // const passwordSettings = usePasswordSettingsMutation();
    const form = useForm({
        defaultValues: {
            newPassword: "",
            currentPassword: "",
            confirmNewPassword: "",
        },
    });

    const onSubmit = async (submittedData: any) => {
        delete submittedData.confirm_new_password;

        // passwordSettings.mutate({ ...submittedData }, {
        //     onError: (error) => {
        //         if (error?.errors?.json?.currentPassword) {
        //             const message = error.errors.json.currentPassword[0];
        //             return form.setError("currentPassword", { type: "manual", message });
        //         }
        //         toast.error("An error occurred while updating your password");
        //     },
        //     onSuccess: () => toast.success("Settings successfully updated"),
        //     onSettled: () => form.reset(),
        // });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full">
                <div className="space-y-5">
                    <FormField
                        control={form.control}
                        name="currentPassword"
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
                        name="newPassword"
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
                        name="confirmNewPassword"
                        rules={{
                            validate: (val) => {
                                if (form.watch("newPassword") !== val) {
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
                <Button className="mt-5">
                    Update
                </Button>
            </form>
        </Form>
    );
};
