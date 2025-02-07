import {toast} from "sonner";
import {router} from "@/router";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {queryClient} from "@/api/queryClient";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {Separator} from "@/components/ui/separator";
import {FormButton} from "@/components/app/FormButton";
import {Link, useNavigate} from "@tanstack/react-router";
import {queryKeys, useAuth, useSimpleMutations} from "@/api";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/components/ui/dialog";


export const LoginForm = ({ open, onOpenChange }) => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { oAuth2Provider } = useSimpleMutations();
    const form = useForm({ defaultValues: { username: "", password: "" }, shouldFocusError: false });

    const onSubmit = (data) => {
        login.mutate(data, {
            onError: (error) => {
                if (error.status === 401) {
                    form.setError("username", { type: "manual", message: "Username or password incorrect." });
                    form.setError("password", { type: "manual", message: "Username or password incorrect." });
                    return;
                }
                if (error.status === 403) {
                    return toast.error("Your account is not activated yet. Please check your email or contact us.");
                }
                toast.error("An error occurred trying to login");
            },
            onSuccess: async () => {
                await router.invalidate();
                const currentUser = queryClient.getQueryData(queryKeys.authKey());
                // noinspection JSCheckFunctionSignatures
                await navigate({ to: `/profile/${currentUser.username}` });
            },
        });
    };

    const withProvider = (provider) => {
        oAuth2Provider.mutate({ provider, callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider) }, {
            onError: () => toast.error("An error occurred with the provider"),
            onSuccess: async (data) => window.location.replace(data.redirect_url),
        });
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
                            <FormButton disabled={login.isPending || oAuth2Provider.isSuccess}>
                                Login
                            </FormButton>
                        </form>
                    </Form>
                    <Separator className="mt-3" variant="large"/>
                    <div className="mt-3 flex-col space-y-2">
                        <FormButton variant="secondary" onClick={() => withProvider("google")}
                                    disabled={login.isPending || oAuth2Provider.isSuccess}>
                            <FaGoogle size={20} className="mr-2"/> Connexion via Google
                        </FormButton>
                        <FormButton variant="secondary" onClick={() => withProvider("github")}
                                    disabled={login.isPending || oAuth2Provider.isSuccess}>
                            <FaGithub size={20} className="mr-2"/> Connexion via Github
                        </FormButton>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
