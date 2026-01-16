import {Layers, Plus} from "lucide-react";
import {capitalize} from "@/lib/utils/formating";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {userCollectionsAndMediaOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/list/$mediaType/$username/_header/collections")({
    loader: async ({ context: { queryClient }, params: { mediaType, username } }) => {
        return queryClient.ensureQueryData(userCollectionsAndMediaOptions(mediaType, username));
    },
    component: CollectionsView,
});


// TODO: Add way to delete collection and to add a new one empty, then can add multiple on the list part
function CollectionsView() {
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();
    const isCurrent = !!currentUser && currentUser?.name === username;
    const collections = useSuspenseQuery(userCollectionsAndMediaOptions(mediaType, username)).data;

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collections`} onlyHelmet>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            {isCurrent ? "Your" : `${username}`} Collections
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Curated collections from {isCurrent ? "your" : `${username}`} library
                        </p>
                    </div>
                    <Button variant="outline" size="sm">
                        <Plus className="size-4"/> New Collection
                    </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {collections.map((col) =>
                        <Link
                            key={col.collectionId}
                            className="group block"
                            params={{ mediaType, username }}
                            to={"/list/$mediaType/$username"}
                            search={{ collections: [col.collectionName] }}
                        >
                            <div className="relative group aspect-video bg-muted/30 rounded-xl border overflow-hidden transition-all
                            duration-300 group-hover:border-app-accent/50 group-hover:shadow-md group-hover:bg-muted/50">
                                <div className="relative flex h-full items-center justify-center p-6">
                                    {col.medias.slice(0, 5).map((item, idx, arr) => {
                                        const midIndex = (arr.length - 1) / 2;
                                        const offset = idx - midIndex;

                                        return (
                                            <div
                                                key={item.mediaId}
                                                style={{ zIndex: idx, "--offset": `${offset * 70}%` } as React.CSSProperties}
                                                className="absolute aspect-2/3 w-1/3 overflow-hidden rounded-md border
                                                transition-all duration-200 ease-out translate-x-(--offset)"
                                            >
                                                <img
                                                    alt={item.mediaName}
                                                    src={item.mediaCover}
                                                    className="h-full w-full object-cover"
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                            <div className="p-2 flex items-end justify-between">
                                <div>
                                    <h3 className="font-bold leading-tight group-hover:text-app-accent transition-colors">
                                        {col.collectionName}
                                    </h3>
                                    <span className="flex items-center gap-1 pt-1 text-[10px] font-medium text-muted-foreground">
                                        <Layers className="size-3"/> {col.totalCount} items
                                    </span>
                                </div>
                            </div>
                        </Link>
                    )}

                    <button className="group relative aspect-video rounded-xl border border-dashed hover:border-app-accent/50
                    hover:bg-muted/10 transition-all flex flex-col items-center justify-center
                    gap-3 text-muted-foreground hover:text-app-accent">
                        <div className="p-3 rounded-full bg-muted group-hover:bg-app-accent/10 transition-colors">
                            <Plus className="size-6"/>
                        </div>
                        <span className="font-medium">
                            New Collection
                        </span>
                    </button>
                </div>
            </div>
        </PageTitle>
    );
}
