import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {Collection} from "@/lib/types/base.types";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {useQueryClient} from "@tanstack/react-query";
import {Badge} from "@/lib/client/components/ui/badge";
import {Separator} from "@/lib/client/components/ui/separator";
import {CollectionsDialog} from "@/lib/client/components/media/base/CollectionsDialog";
import {UserMediaQueryOption} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface CollectionListsProps {
    mediaId: number;
    mediaType: MediaType;
    mediaCollections: Collection[];
    queryOption: UserMediaQueryOption;
}


export const CollectionLists = ({ queryOption, mediaType, mediaId, mediaCollections }: CollectionListsProps) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const updateUserCollections = (newCollectionsList: (Collection | undefined)[]) => {
        if (queryOption.queryKey[0] === "details") {
            queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                if (!oldData) return;

                return {
                    ...oldData,
                    userMedia: Object.assign({}, oldData.userMedia, { collections: newCollectionsList }),
                };
            })
        }
        else if (queryOption.queryKey[0] === "userList") {
            queryClient.setQueryData(queryOption.queryKey, (oldData) => {
                if (!oldData) return;
                return {
                    ...oldData,
                    results: Object.assign({}, oldData.results, {
                        items: oldData.results.items.map((m) =>
                            m.mediaId === mediaId ? Object.assign({}, m, { collections: newCollectionsList }) : m
                        )
                    }),
                };
            });
        }
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Collections
                <CollectionsDialog
                    mediaId={mediaId}
                    mediaType={mediaType}
                    collections={mediaCollections}
                    updateUserCollections={updateUserCollections}
                />
            </h4>
            <Separator className="-mt-1 mb-1"/>
            <div className="flex flex-wrap gap-2">
                {mediaCollections.length === 0 ?
                    <div className="text-muted-foreground text-sm">
                        No collections added yet.
                    </div>
                    :
                    mediaCollections.map((col) =>
                        <Link
                            key={col.name}
                            to="/list/$mediaType/$username"
                            search={{ collections: [col.name] }}
                            params={{ mediaType, username: currentUser!.name }}
                        >
                            <Badge variant="collection" key={col.name}>
                                <div className="flex justify-between gap-2">
                                    {col.name}
                                </div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
