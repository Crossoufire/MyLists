import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {api, userClient} from "@/api/MyApiClient";
import {PageTitle} from "@/components/app/base/PageTitle.jsx";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSUnusedGlobalSymbols,JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/admin/")({
    component: AdminPage,
    loader: () => {
        if (userClient.currentUser.role === "user") {
            throw new Error(JSON.stringify({
                status: 404,
                message: "Page not found",
                description: "Sorry the requested page was not found",
            }))
        }
    },
});


function AdminPage() {
    const form = useForm();
    const navigate = useNavigate();

    const onSubmit = async (data) => {
        const response = await api.adminLogin(data.password);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success("Admin elevation granted.");
        return navigate({ to: "/admin/dashboard" });
    };

    return (
        <PageTitle title="Admin" subtitle="Enter the admin credentials to access the admin dashboard panel">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 max-w-[400px] mas-sm:w-full">
                    <FormField
                        control={form.control}
                        name="password"
                        rules={{required: true}}
                        render={({ field }) => (
                            <FormItem>
                                <FormLabel>Enter Password</FormLabel>
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
                    <div className="mt-3">
                        <Button type="submit">Submit</Button>
                    </div>
                </form>
            </Form>
        </PageTitle>
    );
}
