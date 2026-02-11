import {Copy, Heart, Pencil} from "lucide-react";
import {capitalize} from "@/lib/utils/formating";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {MediaCard} from "@/lib/client/components/media/base/MediaCard";
import {collectionDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {useCopyCollectionMutation, useToggleCollectionLikeMutation} from "@/lib/client/react-query/query-mutations/collections.mutations";


export const Route = createFileRoute("/_main/_private/collections/$collectionId/")({
    params: { parse: (params) => ({ collectionId: Number(params.collectionId) }) },
    loader: ({ context: { queryClient }, params: { collectionId } }) => {
        return queryClient.ensureQueryData(collectionDetailsOptions(collectionId));
    },
    component: CollectionViewer,
});


function CollectionViewer() {
    const navigate = Route.useNavigate();
    const { collectionId } = Route.useParams();
    const copyMutation = useCopyCollectionMutation(collectionId);
    const toggleLikeMutation = useToggleCollectionLikeMutation(collectionId);
    const apiData = useSuspenseQuery(collectionDetailsOptions(collectionId)).data;
    const { collection, items, isOwner, isLiked } = apiData;

    const handleLikeCollection = () => {
        toggleLikeMutation.mutate({ data: { collectionId } });
    };

    const handleCopyCollection = async () => {
        const result = await copyMutation.mutateAsync({ data: { collectionId } });
        await navigate({ to: "/collections/$collectionId/edit", params: { collectionId: result.id } });
    };

    const handleEditCollection = async () => {
        await navigate({ to: "/collections/$collectionId/edit", params: { collectionId: collectionId } });
    };

    return (
        <PageTitle
            title={collection.title}
            subtitle={`${collection.ownerName} • ${capitalize(collection.mediaType)} • ${collection.itemsCount} items`}
        >
            <div className="flex flex-wrap items-center gap-3">
                <Button
                    size="sm"
                    onClick={handleLikeCollection}
                    disabled={toggleLikeMutation.isPending}
                    variant={isLiked ? "default" : "outline"}
                >
                    <Heart className="size-4"/> {collection.likeCount}
                </Button>
                <Button size="sm" variant="outline" onClick={handleCopyCollection} disabled={copyMutation.isPending}>
                    <Copy className="size-4"/> Copy
                </Button>
                {isOwner &&
                    <Button size="sm" variant="outline" onClick={handleEditCollection}>
                        <Pencil className="size-4"/> Edit
                    </Button>
                }
                <Badge variant="outline">
                    {collection.ordered ? "Ranked" : "Unranked"}
                </Badge>
            </div>
            {collection.description &&
                <div className="pt-2 text-sm text-muted-foreground max-w-3xl">
                    {collection.description}
                </div>
            }

            {items.length === 0 ?
                <EmptyState
                    icon={Heart}
                    message="This collection does not have any items yet."
                />
                :
                <div className="pt-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {items.map((item) =>
                        <MediaCard key={item.mediaId} item={item} mediaType={collection.mediaType}>
                            <div className="absolute inset-0 flex flex-col justify-between p-3">
                                {collection.ordered &&
                                    <div className="self-start rounded-full bg-black/70 px-2 py-0.5 text-xs font-semibold text-white">
                                        #{item.orderIndex}
                                    </div>
                                }
                                <div className="mt-auto space-y-1 rounded-md bg-black/70 p-2">
                                    <div className="text-sm font-semibold text-white line-clamp-2">
                                        {item.mediaName}
                                    </div>
                                    {item.annotation &&
                                        <div className="text-xs text-white/80 line-clamp-2">
                                            {item.annotation}
                                        </div>
                                    }
                                </div>
                            </div>
                        </MediaCard>
                    )}
                </div>
            }
        </PageTitle>
    );
}
