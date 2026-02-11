import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {CollectionEditor} from "@/lib/client/components/collections/CollectionEditor";
import {collectionDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {useUpdateCollectionMutation} from "@/lib/client/react-query/query-mutations/collections.mutations";


export const Route = createFileRoute("/_main/_private/collections/$collectionId/edit")({
    params: {
        parse: (params) => {
            return { collectionId: Number(params.collectionId) }
        }
    },
    loader: async ({ context: { queryClient }, params: { collectionId } }) => {
        return queryClient.ensureQueryData(collectionDetailsOptions(collectionId));
    },
    component: CollectionEditPage,
});


function CollectionEditPage() {
    const { collectionId } = Route.useParams();
    const updateMutation = useUpdateCollectionMutation(collectionId);
    const apiData = useSuspenseQuery(collectionDetailsOptions(collectionId)).data;

    if (!apiData.isOwner) {
        return (
            <PageTitle
                title="Collection editor"
                subtitle="You do not have permission to edit this collection."
            />
        );
    }

    const { collection } = apiData;

    return (
        <PageTitle title={`Edit ${collection.title}`} subtitle="Refine your list and annotations.">
            <CollectionEditor
                submitLabel="Update Collection"
                mediaType={collection.mediaType}
                isSubmitting={updateMutation.isPending}
                onSubmit={(payload) => updateMutation.mutate({ data: { collectionId, ...payload } })}
                initialData={{
                    items: apiData.items,
                    title: collection.title,
                    ordered: collection.ordered,
                    privacy: collection.privacy,
                    description: collection.description,
                }}
            />
        </PageTitle>
    );
}
