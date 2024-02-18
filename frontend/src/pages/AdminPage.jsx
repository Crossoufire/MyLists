import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {ErrorPage} from "@/pages/ErrorPage";
import {useNavigate} from "react-router-dom";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {useUser} from "@/providers/UserProvider";
import {PageTitle} from "@/components/app/PageTitle";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const AdminPage = () => {
    const api = useApi();
    const form = useForm();
    const navigate = useNavigate();
    const { currentUser } = useUser();

    if (currentUser.role === "user") {
        return <ErrorPage/>;
    }

    const onSubmit = async (data) => {
        const response = await api.adminLogin(data.password);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success("Admin elevation granted.");
        return navigate("/admin/dashboard");
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
};
