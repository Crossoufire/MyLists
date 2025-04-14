import {toast} from "sonner";
import {Button} from "../ui/button";
import {useForm} from "react-hook-form";
import {Input} from "@/lib/components/ui/input";
import authClient from "@/lib/utils/auth-client";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {useQueryClient} from "@tanstack/react-query";
import {Separator} from "@/lib/components/ui/separator";
import {queryKeys} from "@/lib/react-query/query-options";
import {Link, useNavigate, useRouter} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/components/ui/dialog";


interface LoginFormProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}


export const LoginForm = ({ open, onOpenChange }: LoginFormProps) => {
    const router = useRouter();
    const navigate = useNavigate();
    const queryClient = useQueryClient();
    const form = useForm({
        shouldFocusError: false,
        defaultValues: {
            username: "",
            password: "",
        },
    });

    const onSubmit = async (submitted: any) => {
        const { data, error } = await authClient.signIn.email({
            email: submitted.username,
            password: submitted.password,
            rememberMe: true,
        });

        if (error) {
            if (error.status === 401) {
                form.setError("root", { type: "value", message: error.message }, { shouldFocus: false });
                return;
            }
            toast.error("An unexpected error occurred. Please try again later.");
            return;
        }

        await router.invalidate();
        await queryClient.setQueryData(queryKeys.authKey(), data.user);
        await navigate({ to: "/profile/$username", params: { username: data.user.name }, replace: true });
    };

    const withProvider = async (provider: "google" | "github") => {
        const { data, error } = await authClient.signIn.social({ provider })
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-sm:w-full w-[350px] bg-neutral-950">
                <DialogHeader>
                    <DialogTitle>Login to MyLists</DialogTitle>
                    <DialogDescription></DialogDescription>
                </DialogHeader>
                <div className="mt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="username"
                                    rules={{ required: "This field is required" }}
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
                                    name="password"
                                    rules={{ required: "This field is required" }}
                                    render={({ field }) =>
                                        <FormItem>
                                            <div className="flex items-center justify-between">
                                                <FormLabel>Password</FormLabel>
                                                <Link to="/forgot-password" className="text-sm underline" tabIndex={-1}
                                                      onClick={() => onOpenChange(false)}>
                                                    Forgot password?
                                                </Link>
                                            </div>
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
                            <Button>
                                Login
                            </Button>
                        </form>
                    </Form>
                    <Separator className="mt-3"/>
                    <div className="mt-3 flex-col space-y-2">
                        <Button variant="secondary" onClick={() => withProvider("google")}>
                            <FaGoogle size={20} className="mr-2"/> Connexion via Google
                        </Button>
                        <Button variant="secondary" onClick={() => withProvider("github")}>
                            <FaGithub size={20} className="mr-2"/> Connexion via Github
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
