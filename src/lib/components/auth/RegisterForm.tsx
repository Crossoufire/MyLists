import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {LoaderCircle} from "lucide-react";
import {Input} from "@/lib/components/ui/input";
import authClient from "@/lib/utils/auth-client";
import {Button} from "@/lib/components/ui/button";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/components/ui/dialog";


interface RegisterFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


type FormValues = {
    email: string;
    username: string;
    password: string;
    confirmPassword: string;
}


export const RegisterForm = ({ open, onOpenChange }: RegisterFormProps) => {
    const form = useForm<FormValues>({
        defaultValues: {
            email: "",
            username: "",
            password: "",
            confirmPassword: "",
        },
        shouldFocusError: false,
    });

    const onSubmit = async (submitted: FormValues) => {
        await authClient.signUp.email({
            email: submitted.email,
            name: submitted.username,
            password: submitted.password,
        }, {
            onError: (ctx) => {
                form.setError("root", { type: "value", message: ctx.error.message }, { shouldFocus: false });
            },
            onSuccess: () => {
                form.reset();
                onOpenChange(false);
                toast.success("Your account has been created. Check your email to activate your account.");
            },
        });
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
                        <fieldset disabled={form.formState.isSubmitting}>
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
                        </fieldset>
                        {form.formState.errors.root &&
                            <FormMessage className="text-center -mt-1.5">
                                {form.formState.errors.root.message}
                            </FormMessage>
                        }
                        <Button disabled={form.formState.isSubmitting}>
                            {form.formState.isSubmitting && <LoaderCircle className="size-4 animate-spin"/>} Create an account
                        </Button>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
};
