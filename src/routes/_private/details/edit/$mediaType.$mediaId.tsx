import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {Textarea} from "@/lib/components/ui/textarea";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/components/app/PageTitle";
import {capitalize, sliceIntoParts} from "@/lib/utils/functions";
import {createFileRoute, useRouter} from "@tanstack/react-router";
import {editMediaDetailsOptions} from "@/lib/react-query/query-options";
import {useEditMediaMutation} from "@/lib/react-query/mutations/media.mutations";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/lib/components/ui/form";


export const Route = createFileRoute("/_private/details/edit/$mediaType/$mediaId")({
    params: {
        parse: (params) => {
            return {
                mediaId: parseInt(params.mediaId, 10),
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
    const form = useForm({ defaultValues: { genres: apiData.genres } });
    const parts = sliceIntoParts(apiData.fields, 3);

    const onSubmit = (submittedData: any) => {
        editMediaMutation.mutate({ mediaType, mediaId, payload: submittedData }, {
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
                        <div className="space-y-4">
                            {parts[1].map(arr => renderField(form, arr))}
                            {apiData.genres &&
                                <FormField
                                    name="genres"
                                    control={form.control}
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Genres (Select up to 5)</FormLabel>
                                            <FormControl>
                                                <GenreSelector
                                                    selectedGenres={field.value}
                                                    genresList={apiData.all_genres}
                                                    setSelectedGenres={field.onChange}
                                                />
                                            </FormControl>
                                            <FormMessage/>
                                        </FormItem>
                                    )}
                                />
                            }
                        </div>
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


function GenreSelector({ genresList, selectedGenres, setSelectedGenres }) {
    const toggleGenre = (ev, genre) => {
        ev.preventDefault();

        if (selectedGenres.includes(genre)) {
            setSelectedGenres(selectedGenres.filter(l => l !== genre));
        }
        else {
            if (selectedGenres.length >= 5) return;
            setSelectedGenres([...selectedGenres, genre]);
        }
    };

    return (
        <div className="flex flex-wrap items-center justify-start gap-2">
            {genresList.map(genre =>
                <Button key={genre} variant={selectedGenres.includes(genre) ? "default" : "outline"}
                        onClick={(ev) => toggleGenre(ev, genre)} className="text-sm rounded-full px-3">
                    {genre}
                </Button>
            )}
        </div>
    );
}
