import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {genericMutations} from "@/api/mutations.js";
import {FormError} from "@/components/app/base/FormError";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures,JSUnusedGlobalSymbols
export const Route = createFileRoute("/_public/reset-password")({
    component: ResetPasswordPage,
});


function ResetPasswordPage() {
    const form = useForm();
    const navigate = useNavigate();
    const { token } = Route.useSearch();
    const { resetPassword } = genericMutations();
    const [errorMessage, setErrorMessage] = useState("");

    const onSubmit = (data) => {
        setErrorMessage("");
        resetPassword.mutate({ token, newPassword: data.password }, {
            onError: (error) => {
                if (error.errors) {
                    return setErrorMessage(error.errors.json.token);
                }
                setErrorMessage(error.description);
            },
            onSuccess: async () => {
                toast.success("Your password was successfully modified");
                await navigate({ to: "/" });
            }
        });
    };

    return (
        <PageTitle title="Change your Password" subtitle="You can now change your password to a new one">
            <div className="mt-4 w-[300px] max-sm:w-full">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="space-y-4">
                            <FormField
                                control={form.control}
                                name="password"
                                rules={{
                                    required: "Password is required",
                                    minLength: { value: 8, message: "The password must have at least 8 characters" },
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
                                            return "The passwords do not match";
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
                        {errorMessage && <FormError message={errorMessage}/>}
                        <Button type="submit" className="w-full" disabled={resetPassword.isPending}>
                            Reset password
                        </Button>
                    </form>
                </Form>
            </div>
        </PageTitle>
    );
}
