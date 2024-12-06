import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {simpleMutations} from "@mylists/api/src";
import {PageTitle} from "@/components/app/PageTitle";
import {FormButton} from "@/components/app/FormButton";
import {createLazyFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createLazyFileRoute("/_public/forgot-password")({
    component: ForgotPasswordPage,
});


function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { forgotPassword } = simpleMutations();
    const form = useForm({ defaultValues: { email: "" } });

    const onSubmit = (data) => {
        forgotPassword.mutate({ email: data.email }, {
            onError: (error) => {
                if (error?.errors?.json?.email) {
                    const message = error.errors.json.email[0];
                    return form.setError("email", { type: "manual", message: message });
                }
                toast.error("An error occurred while sending your reset password email");
            },
            onSuccess: async () => {
                toast.success("An email has been sent to your account to reset your password");
                await navigate({ to: "/" });
            },
            onSettled: () => form.reset(),
        });
    };

    return (
        <PageTitle title="Forgot Password" subtitle="Enter the email associated with your account to reset your password">
            <div className="mt-4 max-w-[300px]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="email"
                            rules={{ required: "Email is required" }}
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Email</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            type="email"
                                            placeholder="john.doe@example.com"
                                        />
                                    </FormControl>
                                    <FormMessage/>
                                </FormItem>
                            )}
                        />
                        <FormButton disabled={forgotPassword.isPending}>
                            Submit
                        </FormButton>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}