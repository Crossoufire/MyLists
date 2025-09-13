import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {Textarea} from "@/lib/components/ui/textarea";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {capitalize, sliceIntoParts} from "@/lib/utils/functions";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import {EditGenresSelector} from "@/lib/components/media/books/EditGenresSelector";
import {editMediaDetailsOptions} from "@/lib/react-query/query-options/query-options";
import {useEditMediaMutation} from "@/lib/react-query/query-mutations/media.mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";


export const Route = createFileRoute("/_private/details/edit/$mediaType/$mediaId")({
    params: {
        parse: (params) => {
            return {
                mediaId: parseInt(params.mediaId),
                mediaType: params.mediaType as MediaType,
            }
        }
    },
    loader: ({ context: { queryClient }, params: { mediaType, mediaId } }) => {
        return queryClient.ensureQueryData(editMediaDetailsOptions(mediaType, mediaId));
    },
    component: MediaEditPage,
});


function MediaEditPage() {
    const { history } = useRouter();
    const { mediaType, mediaId } = Route.useParams();
    const editMediaMutation = useEditMediaMutation();
    const apiData = useSuspenseQuery(editMediaDetailsOptions(mediaType, mediaId)).data;

    const form = useForm({
        defaultValues: {
            imageCover: undefined,
            name: apiData.fields?.name,
            genres: apiData.fields?.genres,
            budget: apiData.fields?.budget,
            authors: apiData.fields?.authors,
            revenue: apiData.fields?.revenue,
            tagline: apiData.fields?.tagline,
            synopsis: apiData.fields?.synopsis,
            duration: apiData.fields?.duration,
            homepage: apiData.fields?.homepage,
            createdBy: apiData.fields?.createdBy,
            allGenres: apiData.fields?.allGenres,
            lockStatus: apiData.fields?.lockStatus,
            releaseDate: apiData.fields?.releaseDate,
            lastAirDate: apiData.fields?.lastAirDate,
            originalName: apiData.fields?.originalName,
            directorName: apiData.fields?.directorName,
            originCountry: apiData.fields?.originCountry,
            originalLanguage: apiData.fields?.originalLanguage,
        }
    });
    const parts = sliceIntoParts(Object.entries(apiData.fields), 3);

    const onSubmit = (submittedData: Record<string, any>) => {
        editMediaMutation.mutate({ data: { mediaType, mediaId, payload: submittedData } }, {
            onError: () => toast.error("An error occurred while updating the media"),
            onSuccess: async () => {
                toast.success("Media successfully updated!");
                history.go(-1);
            },
        });
    };

    const renderField = (myForm: any, fieldEntry: [string, any]) => {
        const [key, _] = fieldEntry;

        return (
            <FormField
                key={key}
                name={key}
                control={myForm.control}
                render={({ field }) => (
                    <FormItem>
                        <FormLabel>{capitalize(key.replaceAll("_", " "))}</FormLabel>
                        <FormControl>
                            {key === "synopsis" ?
                                <Textarea {...field} className="h-[130px]"/>
                                :
                                <Input {...field}/>
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
                                name="imageCover"
                                control={form.control}
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>ImageCover URL</FormLabel>
                                        <FormControl>
                                            <Input {...field}/>
                                        </FormControl>
                                        <FormMessage/>
                                    </FormItem>
                                )}
                            />
                            {apiData?.fields?.authors &&
                                <FormField
                                    name="authors"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Authors</FormLabel>
                                            <FormControl>
                                                <Input {...field}/>
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            }
                            {parts[0].map(array => renderField(form, array))}
                        </div>
                        <div className="space-y-4">
                            {parts[1].map(array => renderField(form, array))}
                            {apiData?.fields?.genres &&
                                <FormField
                                    name="genres"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Genres (Select up to 5)</FormLabel>
                                            <FormControl>
                                                <EditGenresSelector
                                                    selectedGenres={field.value}
                                                    setSelectedGenres={field.onChange}
                                                    genresList={apiData?.fields.allGenres}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            }
                        </div>
                        <div className="space-y-4">
                            {parts[2].map(arr => renderField(form, arr))}
                        </div>
                    </div>
                    <div className="flex justify-end">
                        <Button className="mt-5" disabled={editMediaMutation.isPending}>
                            Save Changes
                        </Button>
                    </div>
                </form>
            </Form>
        </PageTitle>
    );
}
