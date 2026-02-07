import {toast} from "sonner";
import {useForm} from "react-hook-form";
import authClient from "@/lib/utils/auth-client";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {useQueryClient} from "@tanstack/react-query";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {Separator} from "@/lib/client/components/ui/separator";
import {Link, useLocation, useNavigate, useRouter} from "@tanstack/react-router";
import {authOptions} from "@/lib/client/react-query/query-options/query-options";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/client/components/ui/form";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


interface LoginFormProps {
    open: boolean;
    contextMessage?: string;
    onOpenChange: (open: boolean) => void;
}


type FormValues = {
    email: string;
    password: string;
};


export const LoginForm = ({ open, onOpenChange, contextMessage }: LoginFormProps) => {
    const router = useRouter();
    const navigate = useNavigate();
    const pathname = useLocation({ select: (loc) => loc.pathname });
    const queryClient = useQueryClient();
    const form = useForm<FormValues>({
        shouldFocusError: false,
        defaultValues: {
            email: "",
            password: "",
        },
    });

    const onSubmit = async (submitted: FormValues) => {
        await authClient.signIn.email({
            rememberMe: true,
            email: submitted.email,
            password: submitted.password,
        }, {
            onError: (ctx) => {
                if (ctx.error.status === 403) {
                    form.setError("root", {
                        type: "value",
                        message: "Please validate your email. A validation link has been sent.",
                    }, { shouldFocus: false });
                }
                else {
                    form.setError("root", { type: "value", message: ctx.error.message });
                }
            },
            onSuccess: async (data: any) => {
                await queryClient.invalidateQueries({ queryKey: authOptions.queryKey });
                await router.invalidate();
                onOpenChange(false);
                await navigate({ to: "/profile/$username", params: { username: data.user.name }, replace: true });
            },
        });
    };

    const withProvider = async (provider: "google" | "github") => {
        await authClient.signIn.social({ provider }, {
            onError: (ctx) => {
                toast.error(ctx.error.message);
            },
        });
    };

    const handleRegisterClick = async (ev: React.MouseEvent<HTMLAnchorElement>) => {
        ev.preventDefault();
        onOpenChange(false);

        await navigate({
            to: pathname,
            replace: true,
            resetScroll: false,
            search: (prev) => ({ ...prev, register: true, login: undefined }),
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-sm:w-full w-87 bg-neutral-950">
                <DialogHeader>
                    <DialogTitle>Login to MyLists</DialogTitle>
                    {!!contextMessage &&
                        <DialogDescription>
                            {contextMessage}
                        </DialogDescription>
                    }
                </DialogHeader>
                <div className="mt-4">
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                            <div className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="email"
                                    rules={{ required: "This field is required" }}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Email</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="Email"
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
                            {form.formState.errors.root &&
                                <FormMessage className="text-center">
                                    {form.formState.errors.root.message}
                                </FormMessage>
                            }
                            <Button className="w-full">Login</Button>
                        </form>
                    </Form>
                    <Separator className="mt-3"/>
                    <div className="mt-3 flex-col space-y-2">
                        <Button variant="secondary" className="w-full" onClick={() => withProvider("google")}>
                            <FaGoogle className="size-4"/> Connexion via Google
                        </Button>
                        <Button variant="secondary" className="w-full" onClick={() => withProvider("github")}>
                            <FaGithub className="size-4"/> Connexion via Github
                        </Button>
                    </div>
                    <div className="mt-4 text-center text-sm text-muted-foreground">
                        Don't have an account?{" "}
                        <Link to={pathname} onClick={handleRegisterClick} className="font-medium text-app-accent hover:text-app-accent/80">
                            Register here
                        </Link>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
