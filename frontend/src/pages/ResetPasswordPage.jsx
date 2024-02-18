import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {PageTitle} from "@/components/app/PageTitle";
import {useNavigate, useSearchParams} from "react-router-dom";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const ResetPasswordPage = () => {
    const api = useApi();
    const form = useForm();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const token = searchParams.get("token");

    const onSubmit = async (data) => {
        const response = await api.post("/tokens/reset_password", {
            token: token,
            new_password: data.password,
        });

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success(response.body.message);
        navigate("/");
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
                        <Button type="submit" className="w-full">
                            Reset password
                        </Button>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
};
