import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {createFileRoute} from "@tanstack/react-router";
import {PageTitle} from "@/components/app/base/PageTitle";
import {useResetPasswordMutation} from "@/utils/mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public/reset-password")({
    component: ResetPasswordPage,
});


function ResetPasswordPage() {
    const form = useForm();
    const { token } = Route.useSearch();
    const mutateResetPassword = useResetPasswordMutation(token);

    const onSubmit = async (data) => {
        await mutateResetPassword.mutateAsync({ newPassword: data.password });
    };

    return (
        <PageTitle title="Change your Password" subtitle="You can now change your password to a new one">
            <div className="mt-4 w-[300px] max-sm:w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                rules={{
                                    required: "Password is required",
                                    minLength: {value: 8, message: "The password must have at least 8 characters"},
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
                                name="confirmPassword"
                                rules={{
                                    validate: (val) => {
                                        // noinspection JSCheckFunctionSignatures
                                        if (form.watch("password") !== val) {
                                            return "The passwords do not match";
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
                        <Button type="submit" className="w-full" disabled={mutateResetPassword.isPending}>
                            Reset password
                        </Button>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}
