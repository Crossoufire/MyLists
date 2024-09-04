import {toast} from "sonner";
import {useState} from "react";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {useUser} from "@/providers/UserProvider";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {Separator} from "@/components/ui/separator";
import {Link, useNavigate} from "@tanstack/react-router";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const LoginForm = () => {
	const {login} = useUser();
	const navigate = useNavigate();
	const [error, setError] = useState("");
	const [isPending, setIsIsPending] = useState(false);
	const form = useForm({
		defaultValues: { username: "", password: "" },
		shouldFocusError: false,
	});

	const onSubmit = async (data) => {
		setError("");
		try {
			setIsIsPending(true);
			const response = await login(data.username, data.password);
			if (response.status === 401) {
				return setError("Username or password incorrect");
			}
			if (!response.ok) {
				return toast.error(response.body.description);
			}
		}
		finally {
			setIsIsPending(false);
		}

		await navigate({ to: `/profile/${data.username}` });
	};

	const withProvider = async (provider) => {
		setError("");
		try {
			setIsIsPending(true);
			const response = await api.get(`/tokens/oauth2/${provider}`, {
				callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
			});
			if (!response.ok) {
				setIsIsPending(false);
				return toast.error(response.body.description);
			}
			window.location.replace(response.body.redirect_url);
		}
		catch {
			toast.error("An unexpected error occurred");
			setIsIsPending(false);
		}
	};

	return (
		<div className="bg-card px-5 p-3 rounded-md">
			<Form {...form}>
				<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
					<div className="space-y-2">
						<FormField
							control={form.control}
							name="username"
							rules={{required: "Please enter a valid username"}}
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
							rules={{required: "This field is required"}}
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
					{error && <FormError message={error}/>}
					<FormButton disabled={isPending}>
						Login
					</FormButton>
				</form>
			</Form>
			<Separator className="mt-3" variant="large"/>
			<div className="mt-3 flex-col space-y-2">
				<FormButton variant="secondary" onClick={() => withProvider("google")} disabled={isPending}>
					<FaGoogle size={20}/>&nbsp;&nbsp;Connexion via Google
				</FormButton>
				<FormButton variant="secondary" onClick={() => withProvider("github")} disabled={isPending}>
					<FaGithub size={20}/>&nbsp;&nbsp;Connexion via Github
				</FormButton>
			</div>
			<Link to="/forgot-password" className="text-blue-500">
				<div className="mt-4">Forgot password?</div>
			</Link>
		</div>
	);
};
