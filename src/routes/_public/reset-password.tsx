import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {LoaderCircle} from "lucide-react";
import {Input} from "@/lib/components/ui/input";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";


export const Route = createFileRoute("/_public/reset-password")({
    validateSearch: (search) => search as { token: string },
    loaderDeps: ({ search }) => ({ search }),
    component: ResetPasswordPage,
});


type FormValues = {
    newPassword: string,
    confirmPassword: string,
}


function ResetPasswordPage() {
    const navigate = useNavigate();
    const { token } = Route.useSearch();
    const form = useForm<FormValues>({
        defaultValues: {
            newPassword: "",
            confirmPassword: "",
        }
    });

    const onSubmit = async (submitted: FormValues) => {
        if (!token) {
            toast.error("The provided token is invalid or expired.");
            return navigate({ to: "/", replace: true });
        }

        await authClient.resetPassword({ token, newPassword: submitted.newPassword }, {
            onError: () => {
                toast.error("An unexpected error occurred. Please try again later.");
            },
            onSuccess: async () => {
                form.reset();
                toast.success("Your password was successfully modified");
                await navigate({ to: "/", replace: true });
            }
        });
    };

    return (
        <PageTitle title="Reset Your Password" subtitle="You can now change your password to a new one">
            <div className="mt-4 w-[300px] max-sm:w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <fieldset disabled={form.formState.isSubmitting}>
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="newPassword"
                                    rules={{
                                        required: "The password is required.",
                                        minLength: { value: 8, message: "The password must have at least 8 characters." },
                                    }}
                                    render={({ field }) =>
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
                                    }
                                />
                                <FormField
                                    control={form.control}
                                    name="confirmPassword"
                                    rules={{
                                        required: "The password confirmation is required.",
                                        validate: (val) => {
                                            if (form.watch("newPassword") !== val) return "The passwords do not match.";
                                        }
                                    }}
                                    render={({ field }) =>
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
                                    }
                                />
                            </div>
                        </fieldset>
                        <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin"/>} Submit
                        </Button>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}