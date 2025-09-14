import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {LoaderCircle} from "lucide-react";
import {Input} from "@/lib/components/ui/input";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";


export const Route = createFileRoute("/_public/forgot-password")({
    component: ForgotPasswordPage,
})


function ForgotPasswordPage() {
    const navigate = useNavigate();
    const form = useForm<{ email: string }>({
        defaultValues: {
            email: "",
        },
    });

    const onSubmit = async (submitted: { email: string }) => {
        await authClient.forgetPassword({
            email: submitted.email,
            redirectTo: "/reset-password",
        }, {
            onError: (ctx) => {
                toast.error(ctx.error.message);
            },
            onSuccess: async () => {
                toast.success("An email was send to reset your password.");
                await navigate({ to: "/" });
            }
        });
    };

    return (
        <PageTitle title="Forgot password" subtitle="Enter the email associated with your account to reset your password">
            <div className="mt-4 max-w-[300px]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            name="email"
                            control={form.control}
                            rules={{ required: "Email is required" }}
                            render={({ field }) =>
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="john.doe@example.com"
                                            disabled={form.formState.isSubmitting}
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            }
                        />
                        <Button type="submit" disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin"/>} Submit
                        </Button>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}
