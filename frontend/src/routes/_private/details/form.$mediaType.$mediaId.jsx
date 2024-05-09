import {toast} from "sonner";
import {api} from "@/api/MyApiClient";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {fetcher} from "@/hooks/FetchDataHook";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {PageTitle} from "@/components/app/PageTitle";
import {capitalize, genreListsToListsOfDict} from "@/lib/utils";
import MultipleSelector from "@/components/ui/multiple-selector";
import {createFileRoute, useNavigate} from "@tanstack/react-router";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures
export const Route = createFileRoute("/_private/details/form/$mediaType/$mediaId")({
    component: MediaEditPage,
    loader: async ({ params }) => fetcher(`/details/form/${params.mediaType}/${params.mediaId}`),
});


function MediaEditPage() {
    const form = useForm();
    const navigate = useNavigate();
    const apiData = Route.useLoaderData();
    const { mediaId, mediaType } = Route.useParams();

    const onSubmit = async (data) => {
        const response = await api.post(`/details/form`, {
            media_id: mediaId,
            media_type: mediaType,
            payload: data,
        });

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success("Media successfully updated!");
        window.scrollTo(0, 0);
        return navigate({ to: `/details/${mediaType}/${mediaId}` });
    };

    return (
        <PageTitle title="Edit media info" subtitle="Edit the details of this media info.">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-5 w-[500px] max-sm:w-full">
                    <FormField
                        name="image_cover"
                        control={form.control}
                        render={({ field }) => (
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
                        <>
                            <FormField
                                name="genres"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>
                                            <div>Genres (select up to 5)</div>
                                        </FormLabel>
                                        <FormControl>
                                            <MultipleSelector
                                                value={field.value}
                                                onChange={field.onChange}
                                                defaultOptions={genreListsToListsOfDict(apiData.genres)}
                                                placeholder="Select genres..."
                                                maxSelected={5}
                                            />
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </>
                    }
                    {apiData.fields.map(f =>
                        <>
                            <FormField
                                key={f[0]}
                                name={f[0]}
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>{capitalize(f[0].replaceAll("_", " "))}</FormLabel>
                                        <FormControl>
                                            {f[0] === "synopsis" ?
                                                <Textarea
                                                    {...field}
                                                    className="h-64"
                                                    defaultValue={f[1]}
                                                />
                                                :
                                                <Input
                                                    {...field}
                                                    defaultValue={f[1]}
                                                />
                                            }
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                        </>
                    )}
                    <Button type="submit" variant="default" className="mt-5">
                        Update
                    </Button>
                </form>
            </Form>
        </PageTitle>
    );
}