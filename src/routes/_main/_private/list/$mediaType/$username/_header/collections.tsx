import {toast} from "sonner";
import {useState} from "react";
import {capitalize} from "@/lib/utils/formating";
import {CollectionAction} from "@/lib/utils/enums";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {Layers, Pen, Plus, Trash2, X} from "lucide-react";
import {createFileRoute, Link} from "@tanstack/react-router";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {collectionsViewOptions} from "@/lib/client/react-query/query-options/query-options";
import {useEditCollectionMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


export const Route = createFileRoute("/_main/_private/list/$mediaType/$username/_header/collections")({
    loader: async ({ context: { queryClient }, params: { mediaType, username } }) => {
        return queryClient.ensureQueryData(collectionsViewOptions(mediaType, username));
    },
    component: CollectionsView,
});


function CollectionsView() {
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();
    const [editingName, setEditingName] = useState("");
    const isCurrent = !!currentUser && currentUser?.name === username;
    const editCollectionMutation = useEditCollectionMutation(mediaType);
    const [newCollectionName, setNewCollectionName] = useState("");
    const collections = useSuspenseQuery(collectionsViewOptions(mediaType, username)).data;
    const [editingCollectionId, setEditingCollectionId] = useState<number | null>(null);
    const [addingLocation, setAddingLocation] = useState<"header" | "grid" | null>(null);

    const handleCreateCollection = () => {
        if (editCollectionMutation.isPending) return;

        const trimmedName = newCollectionName.trim();
        if (!trimmedName) return;

        if (collections.some((c) => c.collectionName === trimmedName)) {
            alert("This collection name already exists");
            return;
        }

        editCollectionMutation.mutate({ collection: { name: trimmedName }, action: CollectionAction.ADD }, {
            onSuccess: () => {
                setAddingLocation(null);
                setNewCollectionName("");
            }
        });
    };

    const handleRenameCollection = (oldName: string) => {
        if (editCollectionMutation.isPending) return;

        const trimmedName = editingName.trim();
        if (!trimmedName || trimmedName === oldName) {
            setEditingCollectionId(null);
            return;
        }

        if (collections.some((c) => c.collectionName === trimmedName && c.collectionName !== oldName)) {
            alert("This collection name already exists");
            return;
        }

        editCollectionMutation.mutate({ collection: { name: trimmedName, oldName }, action: CollectionAction.RENAME }, {
            onError: () => toast.error("An error occurred while renaming the collection"),
            onSuccess: () => {
                setEditingName("");
                setEditingCollectionId(null);
                toast.success("Collection renamed!");
            },
        });
    };

    const handleDeleteCollection = (ev: React.MouseEvent, collectionName: string) => {
        ev.preventDefault();
        ev.stopPropagation();

        if (!window.confirm(`Are you sure you want to delete the collection "${collectionName}"?`)) return;

        editCollectionMutation.mutate({ collection: { name: collectionName }, action: CollectionAction.DELETE_ALL }, {
            onError: () => toast.error("An error occurred while deleting the collection"),
            onSuccess: () => toast.success("Collection deleted!"),
        });
    };

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
                    {isCurrent && (
                        addingLocation === "header" ?
                            <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                <Input
                                    autoFocus
                                    size={30}
                                    className="h-8 w-48"
                                    data-bwignore="true"
                                    value={newCollectionName}
                                    placeholder="Collection name..."
                                    onChange={(ev) => setNewCollectionName(ev.target.value)}
                                    onKeyDown={(ev) => ev.key === "Enter" && handleCreateCollection()}
                                />
                                <Button size="sm" onClick={handleCreateCollection} disabled={editCollectionMutation.isPending}>
                                    Save
                                </Button>
                                <Button size="sm" variant="ghost" onClick={() => setAddingLocation(null)}>
                                    <X className="size-4"/>
                                </Button>
                            </div>
                            :
                            <Button variant="outline" size="sm" onClick={() => setAddingLocation("header")}>
                                <Plus className="size-4"/> New Collection
                            </Button>

                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {collections.map((col) =>
                        <Link
                            key={col.collectionId}
                            className="group block"
                            params={{ mediaType, username }}
                            to={"/list/$mediaType/$username"}
                            search={{ collections: [col.collectionName] }}
                            disabled={editingCollectionId === col.collectionId}
                        >
                            <div className="relative group aspect-video bg-muted/30 rounded-xl border overflow-hidden transition-all
                            duration-300 group-hover:border-app-accent/50 group-hover:shadow-md group-hover:bg-muted/50">
                                {isCurrent && (
                                    <div className="absolute top-2 right-2 z-10 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button
                                            size="icon"
                                            variant="secondary"
                                            onClick={(ev) => {
                                                ev.preventDefault();
                                                ev.stopPropagation();
                                                setEditingName(col.collectionName);
                                                setEditingCollectionId(col.collectionId);
                                            }}
                                            className="size-8"
                                        >
                                            <Pen className="size-4"/>
                                        </Button>
                                        <Button
                                            size="icon"
                                            className="size-8"
                                            variant="destructive"
                                            onClick={(ev) => handleDeleteCollection(ev, col.collectionName)}
                                        >
                                            <Trash2 className="size-4"/>
                                        </Button>
                                    </div>
                                )}
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
                                <div className="flex-1">
                                    {editingCollectionId === col.collectionId ?
                                        <div className="flex items-center gap-2" onClick={(ev) => ev.stopPropagation()}>
                                            <Input
                                                autoFocus
                                                value={editingName}
                                                data-bwignore="true"
                                                className="h-7 text-sm text-primary"
                                                onChange={(ev) => setEditingName(ev.target.value)}
                                                onBlur={() => handleRenameCollection(col.collectionName)}
                                                onKeyDown={(ev) => {
                                                    if (ev.key === "Escape") setEditingCollectionId(null);
                                                    if (ev.key === "Enter") handleRenameCollection(col.collectionName);
                                                }}
                                            />
                                        </div>
                                        :
                                        <>
                                            <h3 className="font-bold leading-tight group-hover:text-app-accent transition-colors">
                                                {col.collectionName}
                                            </h3>
                                            <span className="flex items-center gap-1 pt-1 text-[10px] font-medium text-muted-foreground">
                                                <Layers className="size-3"/> {col.totalCount} items
                                            </span>
                                        </>
                                    }
                                </div>
                            </div>
                        </Link>
                    )}

                    {isCurrent && (
                        addingLocation === "grid" ?
                            <div className="aspect-video rounded-xl border border-dashed flex flex-col items-center justify-center p-6 gap-3">
                                <Input
                                    autoFocus
                                    className="h-8"
                                    data-bwignore="true"
                                    value={newCollectionName}
                                    placeholder="Collection name..."
                                    onChange={(ev) => setNewCollectionName(ev.target.value)}
                                    onKeyDown={(ev) => ev.key === "Enter" && handleCreateCollection()}
                                />
                                <div className="flex gap-2 w-full">
                                    <Button className="flex-1 h-8" size="sm" onClick={handleCreateCollection} disabled={editCollectionMutation.isPending}>
                                        Create
                                    </Button>
                                    <Button className="h-8" size="sm" variant="outline" onClick={() => setAddingLocation(null)}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                            :
                            <button
                                onClick={() => setAddingLocation("grid")}
                                className="group relative aspect-video rounded-xl border border-dashed hover:border-app-accent/50
                                hover:bg-muted/10 transition-all flex flex-col items-center justify-center
                                gap-3 text-muted-foreground hover:text-app-accent"
                            >
                                <div className="p-3 rounded-full bg-muted group-hover:bg-app-accent/10 transition-colors">
                                    <Plus className="size-6"/>
                                </div>
                                <span className="font-medium">
                                    New Collection
                                </span>
                            </button>

                    )}
                </div>
            </div>
        </PageTitle>
    );
}
