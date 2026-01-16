import React, {useState} from "react";
import {capitalize} from "@/lib/utils/formating";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {UserCollection} from "@/lib/types/base.types";
import {Input} from "@/lib/client/components/ui/input";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Button} from "@/lib/client/components/ui/button";
import {DropdownMenu} from "@radix-ui/react-dropdown-menu";
import {createFileRoute, Link} from "@tanstack/react-router";
import {CollectionAction, MediaType} from "@/lib/utils/enums";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {Layers, MoreVertical, Pen, Plus, Trash2, X} from "lucide-react";
import {collectionsViewOptions} from "@/lib/client/react-query/query-options/query-options";
import {useEditCollectionMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";


export const Route = createFileRoute("/_main/_private/list/$mediaType/$username/_header/collections")({
    loader: async ({ context: { queryClient }, params: { mediaType, username } }) => {
        return queryClient.ensureQueryData(collectionsViewOptions(mediaType, username));
    },
    component: CollectionsView,
});


function CollectionsView() {
    const { currentUser } = useAuth();
    const { username, mediaType } = Route.useParams();
    const [newName, setNewName] = useState("");
    const editMutation = useEditCollectionMutation(mediaType);
    const isOwner = !!currentUser && currentUser?.name === username;
    const collections = useSuspenseQuery(collectionsViewOptions(mediaType, username)).data;
    const [editLocation, setEditLocation] = useState<"header" | "grid" | null>(null);

    const handleCreate = () => {
        const trimmed = newName.trim();
        if (!trimmed || editMutation.isPending) return;

        if (collections.some((c) => c.collectionName === trimmed)) {
            return alert("This collection name already exists");
        }

        editMutation.mutate({ collection: { name: trimmed }, action: CollectionAction.ADD }, {
            onSuccess: () => {
                setNewName("");
                setEditLocation(null);
            },
        });
    };

    return (
        <PageTitle title={`${username} ${capitalize(mediaType)} Collections`} onlyHelmet>
            <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center justify-between">
                    <div>
                        <h2 className="text-xl font-semibold tracking-tight">
                            {isOwner ? "Your" : `${username}`} Collections
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            Curated collections from {isOwner ? "your" : `${username}`} list
                        </p>
                    </div>

                    {isOwner &&
                        <div className="flex items-center gap-2">
                            {editLocation === "header" ?
                                <div className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2">
                                    <Input
                                        autoFocus
                                        size={30}
                                        data-bwignore
                                        value={newName}
                                        className="h-8 w-48"
                                        placeholder="New collection..."
                                        onChange={(ev) => setNewName(ev.target.value)}
                                        onKeyDown={(ev) => {
                                            if (ev.key === "Enter") return handleCreate();
                                            if (ev.key === "Escape") {
                                                setNewName("");
                                                setEditLocation(null);
                                            }
                                        }}
                                    />
                                    <Button size="sm" onClick={handleCreate} disabled={editMutation.isPending}>
                                        Save
                                    </Button>
                                    <Button size="sm" variant="ghost" onClick={() => setEditLocation(null)}>
                                        <X className="size-4"/>
                                    </Button>
                                </div>
                                :
                                <Button variant="outline" size="sm" onClick={() => setEditLocation("header")}>
                                    <Plus className="size-4"/> New Collection
                                </Button>
                            }
                        </div>
                    }
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mt-6">
                    {collections.map((col) =>
                        <CollectionCard
                            collection={col}
                            isOwner={isOwner}
                            username={username}
                            mediaType={mediaType}
                            key={col.collectionId}
                            onDelete={(name) => {
                                editMutation.mutate({
                                    collection: { name },
                                    action: CollectionAction.DELETE_ALL,
                                });
                            }}
                            onRename={(oldName, newName) => {
                                editMutation.mutate({
                                    action: CollectionAction.RENAME,
                                    collection: { name: newName, oldName },
                                });
                            }}
                        />
                    )}
                </div>
            </div>
        </PageTitle>
    );
}


interface CollectionCardProps {
    username: string;
    isOwner: boolean;
    mediaType: MediaType;
    collection: UserCollection;
    onDelete: (name: string) => void;
    onRename: (oldName: string, newName: string) => void;
}


const CollectionCard = ({ collection, isOwner, mediaType, username, onRename, onDelete }: CollectionCardProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [editName, setEditName] = useState(collection.collectionName);

    const handleRename = () => {
        if (editName.trim() && editName !== collection.collectionName) {
            onRename(collection.collectionName, editName);
        }
        setIsEditing(false);
    };

    const handleDelete = (ev: React.MouseEvent) => {
        ev.preventDefault();
        ev.stopPropagation();
        if (window.confirm(`Delete "${collection.collectionName}"?`)) {
            onDelete(collection.collectionName);
        }
    };

    return (
        <div>
            <Link
                to="/list/$mediaType/$username"
                params={{ mediaType, username }}
                className={isEditing ? "pointer-events-none" : ""}
                search={{ collections: [collection.collectionName] }}
            >
                <div className="aspect-video rounded-lg border overflow-hidden duration-200 hover:border-app-accent/50">
                    <div className="relative flex h-full items-center justify-center p-6">
                        {collection.medias.map((item, idx, arr) => {
                            const offset = idx - (arr.length - 1) / 2;

                            return (
                                <div
                                    key={item.mediaId}
                                    style={{ zIndex: idx, transform: `translateX(${offset * 70}%)` }}
                                    className="absolute aspect-2/3 w-1/3 overflow-hidden rounded-md border shadow-sm duration-200"
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
            </Link>

            <div className="pt-1">
                {isEditing ?
                    <Input
                        autoFocus
                        data-bwignore
                        value={editName}
                        onBlur={handleRename}
                        className="h-9 text-sm mt-1"
                        onChange={(ev) => setEditName(ev.target.value)}
                        onKeyDown={(ev) => {
                            if (ev.key === "Enter") handleRename();
                            if (ev.key === "Escape") setIsEditing(false);
                        }}
                    />
                    :
                    <div className="flex items-center justify-between pl-1">
                        <div>
                            <h3 className="font-bold">
                                {collection.collectionName}
                            </h3>
                            <span className="flex items-center gap-1 pt-1 text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                <Layers className="size-3"/> {collection.totalCount} items
                            </span>
                        </div>
                        {(isOwner && !isEditing) &&
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button>
                                        <MoreVertical className="size-4 opacity-60 hover:opacity-100"/>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                    <DropdownMenuItem onClick={() => setIsEditing(true)}>
                                        <Pen className="size-4"/> Rename
                                    </DropdownMenuItem>
                                    <DropdownMenuItem className="focus:bg-red-500/10" onClick={handleDelete}>
                                        <Trash2 className="text-red-500"/>
                                        <span className="text-red-500">Delete</span>
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        }
                    </div>
                }
            </div>
        </div>
    );
};
