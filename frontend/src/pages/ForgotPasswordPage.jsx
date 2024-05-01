import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {useNavigate} from "react-router-dom";
import {useApi} from "@/providers/ApiProvider";
import {PageTitle} from "@/components/app/PageTitle";
import {FormError} from "@/components/app/base/FormError.jsx";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const ForgotPasswordPage = () => {
    const api = useApi();
    const navigate = useNavigate();
    const [errors, setErrors] = useState("");
    const form = useForm();
    const [pending, setPending] = useState(false);

    const onSubmit = async (data) => {
        setErrors("");

        setPending(true);
        const response = await api.post("/tokens/reset_password_token", {
            email: data.email,
            callback: import.meta.env.VITE_RESET_PASSWORD_CALLBACK,
        });
        setPending(false);

        if (response.status === 401) {
            return setErrors(response.body.description);
        }

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success("A reset email has been sent to change your password.");
        navigate("/");
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
};
