import {toast} from "sonner";
import {useForm} from "react-hook-form";
import authClient from "@/lib/utils/auth-client";
import {useMutation} from "@tanstack/react-query";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";
import {usePasswordSettingsMutation} from "@/lib/client/react-query/query-mutations/user.mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/client/components/ui/form";


type FormValues = {
    newPassword: string;
    currentPassword: string;
    confirmNewPassword: string;
}


export const EmailAndPasswordForm = () => {
    const passwordMutation = usePasswordSettingsMutation();
    const emailForm = useForm({ defaultValues: { email: "" } });
    const passwordForm = useForm<FormValues>({ defaultValues: { newPassword: "", currentPassword: "", confirmNewPassword: "" } });

    const emailMutation = useMutation({
        mutationFn: async (email: string) => {
            const { error } = await authClient.changeEmail({ newEmail: email });
            if (error) throw error;
        },
        onError: (error) => {
            emailForm.setError("email", { type: "server", message: error.message || "Failed to update email." });
        },
        onSuccess: () => emailForm.reset(),
    });

    const onPasswordSubmit = (values: FormValues) => {
        passwordMutation.mutate({ newPassword: values.newPassword, currentPassword: values.currentPassword }, {
            onError: (error: any) => {
                if (error?.name === "ZodError" && Array.isArray(error.issues)) {
                    error.issues.forEach((issue: any) => {
                        passwordForm.setError(issue.path[0], { message: issue.message });
                    });
                }
                else if (error?.message?.toLowerCase().includes("current password")) {
                    passwordForm.setError("currentPassword", { message: error.message });
                }
                else {
                    passwordForm.setError("root", {
                        message: error.message || "An unexpected error occurred.",
                    });
                }
            },
            onSuccess: () => {
                toast.success("Password updated successfully");
                passwordForm.reset();
            },
        });
    };

    return (
        <div className="space-y-8">
            <Form {...emailForm}>
                <form onSubmit={emailForm.handleSubmit((data) => emailMutation.mutate(data.email))} className="w-full max-w-sm space-y-3">
                    <FormField
                        name="email"
                        control={emailForm.control}
                        rules={{ required: "Email is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Change Your Email</FormLabel>
                                <FormControl>
                                    <Input
                                        type="email"
                                        placeholder="new-email@example.com"
                                        {...field}
                                    />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    {emailMutation.isSuccess &&
                        <p className="text-xs text-green-600 font-medium">
                            Check your inbox to confirm the change of email address.
                        </p>
                    }

                    <Button type="submit" disabled={emailMutation.isPending || !emailForm.formState.isDirty}>
                        {emailMutation.isPending ? "Sending..." : "Change Email"}
                    </Button>
                </form>
            </Form>

            <Separator className="max-w-sm"/>

            {/* Password Change Section */}
            <Form {...passwordForm}>
                <form
                    onSubmit={passwordForm.handleSubmit(onPasswordSubmit)}
                    className="w-full max-w-sm space-y-4"
                >
                    <FormField
                        control={passwordForm.control}
                        name="currentPassword"
                        rules={{ required: "Current password is required" }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Current Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={passwordForm.control}
                        name="newPassword"
                        rules={{
                            required: "New password is required",
                            minLength: { value: 8, message: "Minimum 8 characters" },
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={passwordForm.control}
                        name="confirmNewPassword"
                        rules={{
                            required: "Please confirm your password",
                            validate: (val) => {
                                if (passwordForm.watch("newPassword") !== val) {
                                    return "Passwords do not match";
                                }
                            },
                        }}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Confirm New Password</FormLabel>
                                <FormControl>
                                    <Input type="password" placeholder="********" {...field} />
                                </FormControl>
                                <FormMessage/>
                            </FormItem>
                        )}
                    />

                    {passwordForm.formState.errors.root && (
                        <p className="text-sm font-medium text-destructive">
                            {passwordForm.formState.errors.root.message}
                        </p>
                    )}

                    <Button
                        type="submit"
                        disabled={passwordMutation.isPending || !passwordForm.formState.isDirty}
                    >
                        {passwordMutation.isPending ? "Updating..." : "Update Password"}
                    </Button>
                </form>
            </Form>
        </div>
    );
};