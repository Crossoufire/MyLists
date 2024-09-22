import {toast} from "sonner";
import {useLayoutEffect} from "react";
import {useForm} from "react-hook-form";
import {useAuth} from "@/hooks/AuthHook";
import {Input} from "@/components/ui/input";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {Separator} from "@/components/ui/separator";
import {FormButton} from "@/components/app/base/FormButton";
import {simpleMutations} from "@/api/mutations/simpleMutations";
import {Link, useNavigate, useRouter} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const LoginForm = () => {
    const router = useRouter();
    const { login } = useAuth();
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const { oAuth2Provider } = simpleMutations();
    const form = useForm({ defaultValues: { username: "", password: "" }, shouldFocusError: false });

    useLayoutEffect(() => {
        if (!currentUser) return;
        router.invalidate();
        void navigate({ to: `/profile/${currentUser.username}` });
    }, [currentUser]);

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
            }
        });
    };

    const withProvider = (provider) => {
        oAuth2Provider.mutate({ provider }, {
            onError: () => toast.error("An error occurred with the provider"),
            onSuccess: async (data) => window.location.replace(data.redirect_url),
        });
    };

    return (
        <div className="bg-card px-5 py-3 pb-4 rounded-md">
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
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex items-center justify-between">
                                        <FormLabel>Password</FormLabel>
                                        <Link to="/forgot-password" className="text-sm underline" tabIndex={-1}>
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
                            )}
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
    );
};
