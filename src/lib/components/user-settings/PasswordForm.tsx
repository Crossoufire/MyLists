import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {usePasswordSettingsMutation} from "@/lib/react-query/query-mutations/user.mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";


type FormValues = {
    newPassword: string;
    currentPassword: string;
    confirmNewPassword: string;
}


export const PasswordForm = () => {
    const passwordSettingsMutation = usePasswordSettingsMutation();
    const form = useForm<FormValues>({
        defaultValues: {
            newPassword: "",
            currentPassword: "",
            confirmNewPassword: "",
        },
    });

    const onSubmit = async (submittedData: FormValues) => {
        passwordSettingsMutation.mutate({
            newPassword: submittedData.newPassword,
            currentPassword: submittedData.currentPassword,
        }, {
            onError: (error: any) => {
                if (error?.name === "ZodError" && error?.issues && Array.isArray(error.issues)) {
                    error.issues.forEach((issue: any) => {
                        form.setError(issue.path[0], { type: "server", message: issue.message });
                    });
                }
                else if (error?.message?.includes("Current password is incorrect")) {
                    form.setError("currentPassword", { type: "server", message: error.message });
                }
                else {
                    const message = error?.message || "An unexpected error occurred.";
                    form.setError("root", { type: "server", message: message });
                }
            },
            onSuccess: () => toast.success("Settings successfully updated"),
            onSettled: () => form.reset(),
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[320px] max-sm:w-full">
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
                        rules={{ minLength: { value: 8, message: "New password must have at least 8 characters." } }}
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
                                    return "¨Passwords do not match.";
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
                {form.formState.errors.root && (
                    <p className="mt-2 text-sm font-medium text-destructive">
                        {form.formState.errors.root.message}
                    </p>
                )}
                <Button className="mt-5" disabled={passwordSettingsMutation.isPending || !form.formState.isDirty}>
                    Update
                </Button>
            </form>
        </Form>
    );
};
