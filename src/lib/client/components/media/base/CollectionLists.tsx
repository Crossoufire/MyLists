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
    collections: Collection[];
    queryOption: UserMediaQueryOption;
}


export const CollectionLists = ({ queryOption, mediaType, mediaId, collections }: CollectionListsProps) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const updateCollectionNames = (newCollectionsList: (Collection | undefined)[]) => {
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
                    collections={collections}
                    updateCollection={updateCollectionNames}
                />
            </h4>
            <Separator className="-mt-1 mb-1"/>
            <div className="flex flex-wrap gap-2">
                {collections.length === 0 ?
                    <div className="text-muted-foreground text-sm">
                        Not in a collection yet.
                    </div>
                    :
                    collections.map((col) =>
                        <Link
                            key={col.name}
                            to="/list/$mediaType/$username"
                            search={{ collections: [col.name] }}
                            params={{ mediaType, username: currentUser!.name }}
                        >
                            <Badge key={col.name} variant="collection" className="max-w-50">
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
