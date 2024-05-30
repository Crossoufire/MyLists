import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {Switch} from "@/components/ui/switch";
import {FaQuestionCircle} from "react-icons/fa";
import {api, userClient} from "@/api/MyApiClient";
import {Separator} from "@/components/ui/separator";
import {FormError} from "@/components/app/base/FormError";
import {FormButton} from "@/components/app/base/FormButton";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Form, FormControl, FormField, FormItem, FormLabel} from "@/components/ui/form";


export const MediaListForm = () => {
    const form = useForm();
    const [errors, setErrors] = useState("");
    const [pending, setPending] = useState(false);

    const onSubmit = async (data) => {
        setErrors("");

        setPending(true);
        const response = await api.post("/settings/medialist", data);
        setPending(false);

        if (!response.ok) {
            return setErrors(response.body.description);
        }

        userClient.setCurrentUser(response.body.updated_user);
        toast.success("Settings successfully updated");
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="w-[400px] max-sm:w-full space-y-8">
                {errors && <FormError message={errors}/>}
                <div className="space-y-4">
                    <h3 className="text-base font-medium">
                        Activate Lists Type
                        <Separator/>
                    </h3>
                    <FormField
                        control={form.control}
                        name="add_anime"
                        render={({field}) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        defaultChecked={userClient.currentUser.add_anime}
                                    />
                                </FormControl>
                                <div className="leading-none">
                                    <FormLabel>&nbsp; Activate anime list</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="add_games"
                        render={({field}) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        defaultChecked={userClient.currentUser.add_games}
                                    />
                                </FormControl>
                                <div className="leading-none">
                                    <FormLabel>&nbsp; Activate games list</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                    <FormField
                        control={form.control}
                        name="add_books"
                        render={({field}) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        defaultChecked={userClient.currentUser.add_books}
                                    />
                                </FormControl>
                                <div className="leading-none">
                                    <FormLabel>&nbsp; Activate books list</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
                <div className="space-y-4">
                    <h3 className="text-base font-medium">
                        <div className="flex items-center gap-3">
                            <div>Rating System</div>
                            <Popover>
                                <PopoverTrigger className="opacity-50 hover:opacity-80">
                                    <FaQuestionCircle size={16}/>
                                </PopoverTrigger>
                                <PopoverContent>
                                    Switch between a numerical rating on a scale of 0 to 10 (steps of 0.5)
                                    to an emoticon-based rating (5 levels) to convey your liking or disliking of a media.
                                </PopoverContent>
                            </Popover>
                        </div>
                        <Separator/>
                    </h3>
                    <FormField
                        control={form.control}
                        name="add_feeling"
                        render={({field}) => (
                            <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                                <FormControl>
                                    <Switch
                                        checked={field.value}
                                        onCheckedChange={field.onChange}
                                        defaultChecked={userClient.currentUser.add_feeling}
                                    />
                                </FormControl>
                                <div className="leading-none">
                                    <FormLabel>Score (unchecked) or Feeling (checked)</FormLabel>
                                </div>
                            </FormItem>
                        )}
                    />
                </div>
                <FormButton className="mt-5" pending={pending}>
                    Update
                </FormButton>
            </form>
        </Form>
    );
};
