import {toast} from "sonner";
import {useState} from "react";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {fetcher} from "@/lib/fetcherLoader";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {PageTitle} from "@/components/app/base/PageTitle";
import {FormButton} from "@/components/app/base/FormButton";
import MultipleSelector from "@/components/ui/multiple-selector";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {capitalize, genreListsToListsOfDict, sliceIntoParts} from "@/lib/utils";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/edit/$mediaType/$mediaId")({
    component: MediaEditPage,
    loader: async ({ params }) => fetcher(`/details/edit/${params.mediaType}/${params.mediaId}`),
});


function MediaEditPage() {
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const { mediaId, mediaType } = Route.useParams();
    const parts = sliceIntoParts(apiData.fields, 3);
    const [isPending, setIsPending] = useState(false);
    const form = useForm({
        defaultValues: {
            genres: genreListsToListsOfDict(apiData.genres),
        }
    });

    const onSubmit = async (data) => {
        try {
            setIsPending(true);
            const response = await api.post(`/details/edit`, {
                media_id: mediaId,
                media_type: mediaType,
                payload: data,
            });

            if (!response.ok) {
                return toast.error(response.body.description);
            }

            toast.success("Media successfully updated!");
            await navigate({ to: `/details/${mediaType}/${mediaId}`, resetScroll: true });
        }
        finally {
            setIsPending(false);
        }
    };

    const renderField = (form, arr) => {
        return (
            <FormField
                key={arr[0]}
                name={arr[0]}
                control={form.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{capitalize(arr[0].replaceAll("_", " "))}</FormLabel>
                        <FormControl>
                            {arr[0] === "synopsis" ?
                                <Textarea{...field} className="h-[130px]" defaultValue={arr[1]}/>
                                :
                                <Input{...field} defaultValue={arr[1]}/>
                            }
                        </FormControl>
                        <FormMessage/>
                    </FormItem>
                )}
            />
        )
    };

    return (
        <PageTitle title={`Edit ${capitalize(mediaType)} Details`} subtitle={`Update the media information`}>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-6 space-y-5 mx-auto w-full">
                    <div className="grid grid-cols-3 gap-8 max-sm:grid-cols-1">
                        <div className="space-y-4">
                            <FormField
                                name="image_cover"
                                control={form.control}
                                render={({field}) => (
                                    <FormItem>
                                        <FormLabel>Image Cover URL</FormLabel>
                                        <FormControl>
                                            <Input {...field}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {apiData.genres &&
                                <FormField
                                    name="genres"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Genres (Select up to 5)</FormLabel>
                                            <FormControl>
                                                <MultipleSelector
                                                    maxSelected={5}
                                                    className={"mb-0"}
                                                    value={field.value}
                                                    onChange={field.onChange}
                                                    placeholder={"Select Genres..."}
                                                    defaultOptions={genreListsToListsOfDict(apiData.all_genres)}
                                                    emptyIndicator={
                                                        <p className="text-center text-lg text-gray-400">
                                                            No genres found
                                                        </p>
                                                    }
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            }
                            {parts[0].map(arr => renderField(form, arr))}
                        </div>
                        <div className="space-y-4">
                            {parts[1].map(arr => renderField(form, arr))}
                        </div>
                        <div className="space-y-4">
                            {parts[2].map(arr => renderField(form, arr))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <FormButton className="mt-5" pending={isPending}>
                            Save Changes
                        </FormButton>
                    </div>
                </form>
            </Form>
        </PageTitle>
    );
}