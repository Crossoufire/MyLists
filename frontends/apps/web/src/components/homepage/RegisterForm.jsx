import {toast} from "sonner";
import {useAuth} from "@mylists/api/src";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {FormButton} from "@/components/app/FormButton";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const RegisterForm = ({ onTabChange }) => {
    const { register } = useAuth();
    const form = useForm({
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        shouldFocusError: false,
    });

    const onSubmit = async (data) => {
        const dataToSend = {
            username: data.username,
            email: data.email,
            password: data.password,
            callback: import.meta.env.VITE_REGISTER_CALLBACK,
        };

        register.mutate({ data: dataToSend }, {
            onError: (error) => {
                if (error?.errors?.json?.username) {
                    form.setError("username", { type: "manual", message: error.errors.json.username[0] });
                }
                if (error?.errors?.json?.email) {
                    form.setError("email", { type: "manual", message: error.errors.json.email[0] });
                }
                if (error?.errors?.json?.password) {
                    form.setError("password", { type: "manual", message: error.errors.json.password[0] });
                }
                if (!error.errors) {
                    return toast.error("An error occurred while creating your account");
                }
            },
            onSuccess: () => {
                form.reset();
                toast.success("Your account has been created. Check your email to activate your account.");
                onTabChange("login");
            },
        });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex justify-center">
                    Create an account
                </CardTitle>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="username"
                                rules={{
                                    required: "Username is required.",
                                    minLength: { value: 3, message: "The username is too short (3 min)." },
                                    maxLength: { value: 15, message: "The username is too long (15 max)." },
                                }}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Username</FormLabel>
                                        <FormControl>
                                            <Input
                                                {...field}
                                                placeholder="Username"
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="email"
                                rules={{ required: "Email is required." }}
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
                            <FormField
                                control={form.control}
                                name="password"
                                rules={{
                                    required: "Password is required.",
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
                                name="confirmPassword"
                                rules={{
                                    validate: (val) => {
                                        // noinspection JSCheckFunctionSignatures
                                        if (form.watch("password") !== val) {
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
                        <FormButton disabled={register.isPending}>
                            Create an account
                        </FormButton>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
};
