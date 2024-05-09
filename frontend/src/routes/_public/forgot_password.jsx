import {toast} from "sonner";
import {useState} from "react";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {PageTitle} from "@/components/app/PageTitle";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public/forgot_password")({
    component: ForgotPasswordPage,
});


function ForgotPasswordPage() {
    const form = useForm();
    const navigate = useNavigate();
    const [errors, setErrors] = useState("");
    const [pending, setPending] = useState(false);

    const onSubmit = async (data) => {
        setErrors("");

        setPending(true);
        const response = await api.post("/tokens/reset_password_token", {
            email: data.email,
            callback: import.meta.env.VITE_RESET_PASSWORD_CALLBACK,
        });
        setPending(false);

        if (response.status !== 204) {
            return setErrors(response.body.description);
        }

        toast.success("A reset email has been sent to change your password");
        return navigate({ to :"/" });
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
                        {errors && <FormError message={errors}/>}
                        <FormButton pending={pending}>
                            Submit
                        </FormButton>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}