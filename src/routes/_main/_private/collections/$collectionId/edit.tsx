import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {CollectionEditor} from "@/lib/client/components/collections/CollectionEditor";
import {collectionDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {useDeleteCollectionMutation, useUpdateCollectionMutation} from "@/lib/client/react-query/query-mutations/collections.mutations";


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
    const { currentUser } = useAuth();
    const navigate = Route.useNavigate();
    const { collectionId } = Route.useParams();
    const updateMutation = useUpdateCollectionMutation(collectionId);
    const deleteMutation = useDeleteCollectionMutation(collectionId);
    const apiData = useSuspenseQuery(collectionDetailsOptions(collectionId)).data;

    const handleDeleteCollection = async () => {
        if (deleteMutation.isPending) return;

        if (!window.confirm("This collection will be permanently deleted. Are you sure?")) return;
        await deleteMutation.mutateAsync({ data: { collectionId } });

        const redirectUsername = currentUser?.id === apiData.collection.ownerId ? currentUser?.name : apiData.collection.ownerName;
        await navigate({ to: "/collections/user/$username", params: { username: redirectUsername } });
    };

    return (
        <PageTitle title={`Edit - ${apiData.collection.title}`} subtitle="Refine your collection, descriptions, and annotations.">
            <div className="flex items-center justify-end pb-4">
                <Button
                    variant="destructive"
                    onClick={handleDeleteCollection}
                    disabled={deleteMutation.isPending}
                >
                    Delete Collection
                </Button>
            </div>
            <CollectionEditor
                submitLabel="Update Collection"
                isSubmitting={updateMutation.isPending}
                mediaType={apiData.collection.mediaType}
                onSubmit={(payload) => updateMutation.mutate({ data: { collectionId, ...payload } })}
                initialData={{
                    items: apiData.items,
                    title: apiData.collection.title,
                    ordered: apiData.collection.ordered,
                    privacy: apiData.collection.privacy,
                    description: apiData.collection.description,
                }}
            />
        </PageTitle>
    );
}
