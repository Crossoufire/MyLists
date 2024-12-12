import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/components/ui/input";
import {Textarea} from "@/components/ui/textarea";
import {PageTitle} from "@/components/app/PageTitle";
import {useSuspenseQuery} from "@tanstack/react-query";
import {FormButton} from "@/components/app/FormButton";
import {editMediaOptions} from "@mylists/api/src/queryOptions";
import {useSimpleMutations} from "@mylists/api/src/useSimpleMutations";
import MultipleSelector from "@/components/ui/multiple-selector";
import {createLazyFileRoute, useRouter} from "@tanstack/react-router";
import {capitalize, genreListsToListsOfDict, sliceIntoParts} from "@/utils/functions";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/details/edit/$mediaType/$mediaId")({
    component: MediaEditPage,
});


function MediaEditPage() {
    const { history } = useRouter();
    const { editMediaMutation } = useSimpleMutations();
    const { mediaType, mediaId } = Route.useParams();
    const apiData = useSuspenseQuery(editMediaOptions(mediaType, mediaId)).data;
    const form = useForm({ defaultValues: { genres: genreListsToListsOfDict(apiData.genres) } });
    const parts = sliceIntoParts(apiData.fields, 3);

    const onSubmit = (data) => {
        editMediaMutation.mutate({ mediaType, mediaId, payload: data }, {
            onError: (error) => toast.error(error.description),
            onSuccess: async () => {
                toast.success("Media successfully updated!");
                history.go(-1);
            },
        });
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
        );
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
                            {apiData.authors &&
                                <FormField
                                    name="authors"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Authors</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    defaultValue={apiData.authors}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            }
                            {parts[0].map(arr => renderField(form, arr))}
                        </div>
                        <div className="space-y-4">{parts[1].map(arr => renderField(form, arr))}</div>
                        <div className="space-y-4">{parts[2].map(arr => renderField(form, arr))}</div>
                    </div>
                    <div className="flex justify-end">
                        <FormButton className="mt-5" disabled={editMediaMutation.isPending}>
                            Save Changes
                        </FormButton>
                    </div>
                </form>
            </Form>
        </PageTitle>
    );
}