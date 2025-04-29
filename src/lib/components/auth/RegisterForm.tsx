import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/lib/components/ui/input";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {useQueryClient} from "@tanstack/react-query";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {useNavigate, useRouter} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/components/ui/dialog";


interface RegisterFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export const RegisterForm = ({ open, onOpenChange }: RegisterFormProps) => {
    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const form = useForm({
        defaultValues: {
            username: "",
            email: "",
            password: "",
            confirmPassword: "",
        },
        shouldFocusError: false,
    });

    // const onSubmit = async (data) => {
    //     const dataToSend = {
    //         username: data.username,
    //         email: data.email,
    //         password: data.password,
    //         callback: import.meta.env.VITE_REGISTER_CALLBACK,
    //     };
    //
    //     register.mutate({ data: dataToSend }, {
    //         onError: (error) => {
    //             if (error?.errors?.json?.username) {
    //                 form.setError("username", { type: "manual", message: error.errors.json.username[0] });
    //             }
    //             if (error?.errors?.json?.email) {
    //                 form.setError("email", { type: "manual", message: error.errors.json.email[0] });
    //             }
    //             if (error?.errors?.json?.password) {
    //                 form.setError("password", { type: "manual", message: error.errors.json.password[0] });
    //             }
    //             if (!error.errors) {
    //                 return toast.error("An error occurred while creating your account");
    //             }
    //         },
    //         onSuccess: () => {
    //             form.reset();
    //             toast.success("Your account has been created. Check your email to activate your account.");
    //         },
    //     });
    // };

    const onSubmit = async (submitted: any) => {
        const { data, error } = await authClient.signUp.email({
            email: submitted.email,
            name: submitted.username,
            password: submitted.password,
        });

        if (error) {
            if (error?.message) {
                form.setError("root", { type: "value", message: error.message }, { shouldFocus: false });
                return;
            }
            return toast.error("An error occurred while creating your account. Please try again later.");
        }

        await router.invalidate();
        await queryClient.setQueryData(queryKeys.authKey(), data.user);
        await navigate({ to: "/" });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-sm:w-full w-[320px] bg-neutral-950">
                <DialogHeader>
                    <DialogTitle>Register to Mylists</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 mt-4">
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
                        <Button>
                            Create an account
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
