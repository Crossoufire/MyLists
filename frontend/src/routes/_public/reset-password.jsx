import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {PageTitle} from "@/components/app/base/PageTitle";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public/reset-password")({
    component: ResetPasswordPage,
});


function ResetPasswordPage() {
    const navigate = useNavigate();
    const { token } = Route.useSearch();
    const { resetPassword } = simpleMutations();
    const form = useForm({ defaultValues: { new_password: "", confirm_password: "" } });

    const onSubmit = (data) => {
        resetPassword.mutate({ token, new_password: data.new_password }, {
            onError: (error) => {
                if (error?.errors?.json?.new_password) {
                    const message = error.errors.json.new_password[0];
                    return form.setError("new_password", { type: "manual", message: message });
                }
                toast.error("The provided token is invalid or expired");
            },
            onSuccess: async () => {
                toast.success("Your password was successfully modified");
                await navigate({ to: "/" });
            },
            onSettled: () => form.reset(),
        });
    };

    return (
        <PageTitle title="Change your Password" subtitle="You can now change your password to a new one">
            <div className="mt-4 w-[300px] max-sm:w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="new_password"
                                rules={{
                                    required: "The password is required.",
                                    minLength: { value: 8, message: "The password must have at least 8 characters." },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Password</FormLabel>
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
                                name="confirm_password"
                                rules={{
                                    required: "The password confirmation is required.",
                                    validate: (val) => {
                                        // noinspection JSCheckFunctionSignatures
                                        if (form.watch("new_password") !== val) {
                                            return "The passwords do not match.";
                                        }
                                    }
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Confirm Password</FormLabel>
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
                        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
                            Reset password
                        </Button>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}
