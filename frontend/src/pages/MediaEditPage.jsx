import {toast} from "sonner";
import {useState} from "react";
import {useForm} from "react-hook-form";
import {ErrorPage} from "@/pages/ErrorPage";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useApi} from "@/providers/ApiProvider";
import {Textarea} from "@/components/ui/textarea";
import {useFetchData} from "@/hooks/FetchDataHook";
import {PageTitle} from "@/components/app/PageTitle";
import {Loading} from "@/components/primitives/Loading";
import {useNavigate, useParams} from "react-router-dom";
import {FormError} from "@/components/homepage/FormError";
import {capitalize, genreListsToListsOfDict} from "@/lib/utils";
import MultipleSelector from "@/components/ui/multiple-selector";
import {Form, FormControl, FormField, FormItem, FormLabel, FormMessage} from "@/components/ui/form";


export const MediaEditPage = () => {
    const api = useApi();
    const form = useForm();
    const navigate = useNavigate();
    const {mediaId, mediaType} = useParams();
    const {apiData, loading, error} = useFetchData(`/details/form/${mediaType}/${mediaId}`);

    if (error) return <ErrorPage {...error}/>;
    if (loading) return <Loading/>;

    const onSubmit = async (data) => {

        const response = await api.post(`/details/form/${mediaType}/${mediaId}`, data);

        if (!response.ok) {
            return toast.error(response.body.description);
        }

        toast.success("Media successfully updated.");
        return navigate(`/details/${mediaType}/${mediaId}`);
    };

    return (
        <PageTitle title="Edit media info" subtitle="Edit the details of this media info.">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="mt-4 space-y-5 w-[500px] max-sm:w-full">
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
                                render={({field}) => (
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
};
