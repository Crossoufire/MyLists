import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {useApi} from "@/providers/ApiProvider";
import {useUser} from "@/providers/UserProvider";
import {FaGithub, FaGoogle} from "react-icons/fa";
import {useNavigate, Link} from "react-router-dom";
import {Separator} from "@/components/ui/separator";
import {FormError} from "@/components/homepage/FormError";
import {FormButton} from "@/components/primitives/FormButton";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const LoginForm = () => {
	const api = useApi();
	const { login } = useUser();
	const navigate = useNavigate();
	const [errors, setErrors] = useState("");
	const [pending, setIsPending] = useState(false);
	const form = useForm({ shouldFocusError: false });

	const onSubmit = async (data) => {
		setErrors("");

		setIsPending(true);
		const response = await login(data.username, data.password);
		setIsPending(false);

		if (response.status === 401) {
			return setErrors("Username or password incorrect");
		}

		if (!response.ok) {
			return toast.error(response.body.description);
		}

		navigate(`/profile/${data.username}`);
	};

	const withProvider = async (provider) => {
		const response = await api.get(`/tokens/oauth2/${provider}`, {
			callback: import.meta.env.VITE_OAUTH2_CALLBACK.replace("{provider}", provider),
		});

		if (!response.ok) {
			return toast.error(response.body.description);
		}

		window.location.href= response.body.redirect_url;
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
					{errors && <FormError message={errors}/>}
					<FormButton pending={pending}>
						Login
					</FormButton>
				</form>
			</Form>
			<Separator className="mt-3" variant="large"/>
			<div className="mt-3 flex-col space-y-2">
				<FormButton variant="secondary" onClick={() => withProvider("google")} pending={pending}>
					<FaGoogle size={20}/>&nbsp;&nbsp;Connexion via Google
				</FormButton>
				<FormButton variant="secondary" onClick={() => withProvider("github")} pending={pending}>
					<FaGithub size={20}/>&nbsp;&nbsp;Connexion via Github
				</FormButton>
			</div>
			<Link to="/forgot_password" className="text-blue-500">
				<div className="mt-4">Forgot password?</div>
			</Link>
		</div>
	);
};
