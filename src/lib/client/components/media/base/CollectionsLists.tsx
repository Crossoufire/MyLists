import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {useQuery} from "@tanstack/react-query";
import {Badge} from "@/lib/client/components/ui/badge";
import {Separator} from "@/lib/client/components/ui/separator";
import {CollectionsDialog} from "@/lib/client/components/media/base/CollectionsDialog";
import {userCollectionMembershipsOptions} from "@/lib/client/react-query/query-options/query-options";


interface CollectionsListsProps {
    mediaId: number;
    mediaType: MediaType;
}


export const CollectionsLists = ({ mediaType, mediaId }: CollectionsListsProps) => {
    const { data: collections = [] } = useQuery(userCollectionMembershipsOptions(mediaId, mediaType, true));
    const activeCollections = collections.filter((collection) => collection.hasMedia);

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Collections
                <CollectionsDialog
                    mediaId={mediaId}
                    mediaType={mediaType}
                />
            </h4>
            <Separator className="-mt-1 mb-1"/>
            <div className="flex flex-wrap gap-2">
                {activeCollections.length === 0 ?
                    <div className="text-muted-foreground text-sm">
                        Not added to a collection yet.
                    </div>
                    :
                    activeCollections.map((collection) =>
                        <Link key={collection.id} to="/collections/$collectionId" params={{ collectionId: collection.id }}>
                            <Badge variant="secondary" className="max-w-36">
                                <div className="truncate">
                                    {collection.title}
                                </div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
