import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {genericMutations} from "@/api/mutations.js";
import {Separator} from "@/components/ui/separator";
import {Link, useNavigate} from "@tanstack/react-router";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";
import {useAuth} from "@/hooks/AuthHook.jsx";


export const LoginForm = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { oAuth2Provider } = genericMutations();
    const [errorMessage, setErrorMessage] = useState("");
    const form = useForm({ defaultValues: { username: "", password: "" }, shouldFocusError: false });

    const onSubmit = (data) => {
        setErrorMessage("");
        login.mutate({ username: data.username, password: data.password }, {
            onError: (error) => {
                if (error.status === 401) {
                    return setErrorMessage("Username or password incorrect");
                }
                return toast.error(error.message);
            },
            onSuccess: async () => {
                await navigate({ to: `/profile/${data.username}` });
            },
        });
    };

    const withProvider = async (provider) => {
        setErrorMessage("");

        oAuth2Provider.mutate({ provider: provider }, {
            onError: (error) => setErrorMessage(error.description),
            onSuccess: async (data) => {
                return window.location.replace(data.redirect_url);
            },
        });
    };

    return (
        <div className="bg-card px-5 p-3 rounded-md">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <FormField
                            control={form.control}
                            name="username"
                            rules={{ required: "Please enter a valid username" }}
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
                    </div>
                    {errorMessage && <FormError message={errorMessage}/>}
                    <FormButton disabled={login.isPending || oAuth2Provider.isPending}>
                        Login
                    </FormButton>
                </form>
            </Form>
            <Separator className="mt-3" variant="large"/>
            <div className="mt-3 flex-col space-y-2">
                <FormButton variant="secondary" onClick={() => withProvider("google")}
                            disabled={login.isPending || oAuth2Provider.isPending}>
                    <FaGoogle size={20}/>&nbsp;&nbsp;Connexion via Google
                </FormButton>
                <FormButton variant="secondary" onClick={() => withProvider("github")}
                            disabled={login.isPending || oAuth2Provider.isPending}>
                    <FaGithub size={20}/>&nbsp;&nbsp;Connexion via Github
                </FormButton>
            </div>
            <Link to="/forgot-password" className="text-blue-500">
                <div className="mt-4">Forgot password?</div>
            </Link>
        </div>
    );
};
