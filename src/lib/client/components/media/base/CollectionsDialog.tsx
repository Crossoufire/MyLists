import {cn} from "@/lib/utils/helpers";
import {useMemo, useState} from "react";
import {Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {Collection} from "@/lib/types/base.types";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {CollectionAction, MediaType} from "@/lib/utils/enums";
import {collectionNamesOptions} from "@/lib/client/react-query/query-options/query-options";
import {Check, ChevronRight, Layers, LoaderCircle, PlusCircle, TriangleAlert} from "lucide-react";
import {useEditCollectionMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger} from "@/lib/client/components/ui/credenza";


interface CollectionsDialogProps {
    mediaId: number;
    mediaType: MediaType;
    collections: Collection[];
    updateCollection: (collections: (Collection | undefined)[]) => void;
}


export const CollectionsDialog = ({ mediaType, mediaId, collections, updateCollection }: CollectionsDialogProps) => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const mutation = useEditCollectionMutation(mediaType, mediaId);
    const { data: allCollections = [], isLoading } = useQuery(collectionNamesOptions(mediaType, isOpen));
    const [toast, setToast] = useState<{ type: "error" | "success"; message: string } | null>(null);

    const activeIds = useMemo(() => new Set(collections.map((c) => c.name)), [collections]);
    const filteredCollections = allCollections.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

    const showCreateButton = searchQuery.trim().length > 0
        && !allCollections.some((c) => c.name.toLowerCase() === searchQuery.trim().toLowerCase());

    const handleAction = (collection: Collection, action: CollectionAction) => {
        mutation.mutate({ collection, action }, {
            onSuccess: (data) => {
                if (action === CollectionAction.ADD) {
                    updateCollection([...collections, data]);
                    setSearchQuery("");
                }
                else {
                    updateCollection(collections.filter((c) => c.name !== collection.name));
                }
            },
            onError: () => setToast({ message: "Action failed", type: "error" })
        });
    };

    return (
        <Credenza open={isOpen} onOpenChange={setIsOpen}>
            <CredenzaTrigger className="text-muted-foreground text-sm -mb-1">
                Manage
            </CredenzaTrigger>
            <CredenzaContent className="w-100 p-0 overflow-hidden bg-popover shadow-2xl max-sm:w-full">
                <div className="p-6 pb-4">
                    <CredenzaHeader className="p-0 mb-6 mt-2">
                        <CredenzaTitle>
                            Manage Collections
                        </CredenzaTitle>
                        <CredenzaDescription>
                            Add this {mediaType} to your collections to organize your list.
                        </CredenzaDescription>
                    </CredenzaHeader>

                    <div className="relative group">
                        <Input
                            autoFocus
                            value={searchQuery}
                            disabled={isLoading}
                            className="h-11 bg-popover/50"
                            placeholder="Find or create a collection..."
                            onChange={(ev) => setSearchQuery(ev.target.value)}
                            onKeyDown={(ev) => {
                                if (ev.key === "Enter" && showCreateButton) {
                                    handleAction({ name: searchQuery.trim() }, CollectionAction.ADD);
                                }
                            }}
                        />

                        <div className="absolute right-1.5 top-1/2 -translate-y-1/2 h-8 flex items-center">
                            {showCreateButton ?
                                <Button
                                    size="sm"
                                    className="h-7 bg-app-accent/50 hover:bg-app-accent/70 text-[10px]
                                    font-bold px-2.5 rounded shadow-sm transition-all text-primary/90"
                                    onClick={() => handleAction({ name: searchQuery.trim() }, CollectionAction.ADD)}
                                >
                                    CREATE
                                </Button>
                                :
                                <div className="px-2 py-1 rounded bg-popover/50 border text-[10px] text-muted-foreground font-mono tracking-tighter">
                                    ESC
                                </div>
                            }
                        </div>
                    </div>
                </div>

                <div className="flex flex-col border-t bg-accent/20">
                    <div className="h-70 overflow-y-auto p-2 scrollbar-thin">
                        {isLoading ?
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
                                <LoaderCircle className="size-6 animate-spin"/>
                                <span className="text-xs font-medium">Syncing...</span>
                            </div>
                            : filteredCollections.length === 0 ?
                                <div className="flex flex-col items-center justify-center h-full text-center p-6">
                                    <PlusCircle className="size-8 text-muted-foreground mb-3 opacity-50"/>
                                    <p className="text-sm text-zinc-400 font-medium">
                                        No collection found
                                    </p>
                                    <p className="text-xs text-zinc-600 mt-1">
                                        {searchQuery ?
                                            `Click 'create' to create '${searchQuery.trim()}' collection.`
                                            :
                                            "Start typing to create your first list."
                                        }
                                    </p>
                                </div>
                                :
                                <div className="grid gap-0.5">
                                    {filteredCollections.map((col) => {
                                        const isActive = activeIds.has(col.name);

                                        return (
                                            <button
                                                key={col.name}
                                                disabled={mutation.isPending}
                                                onClick={() => handleAction(col, isActive ? CollectionAction.DELETE_ONE : CollectionAction.ADD)}
                                                className={cn("flex items-center justify-between w-full px-3 py-3 " +
                                                    "rounded-lg text-sm transition-all group", isActive
                                                    ? "bg-app-accent/4 text-app-accent" : "text-primary/90 hover:bg-popover"
                                                )}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "size-4.5 rounded border flex items-center justify-center transition-all",
                                                        isActive
                                                            ? "bg-app-accent border-app-accent scale-110"
                                                            : "bg-popover group-hover:border-zinc-500"
                                                    )}>
                                                        {isActive && <Check className="size-3 text-popover stroke-4"/>}
                                                    </div>
                                                    <span className="font-medium">
                                                        {col.name}
                                                    </span>
                                                </div>

                                                {isActive &&
                                                    <div className="flex items-center gap-1.5 animate-in fade-in zoom-in-95">
                                                        <div className="size-1.5 rounded-full bg-app-accent"/>
                                                        <span className="text-[10px] font-bold uppercase tracking-widest">
                                                            active
                                                        </span>
                                                    </div>
                                                }
                                            </button>
                                        );
                                    })}
                                </div>
                        }
                    </div>

                    <div className="p-4 border-t flex items-center justify-between bg-popover">
                        <Link
                            to="/list/$mediaType/$username/collections"
                            params={{ mediaType, username: currentUser!.name }}
                            className="flex items-center gap-1.5 text-xs text-primary/90 hover:text-app-accent transition-colors"
                        >
                            <Layers className="size-3"/>
                            Open Collections
                            <ChevronRight className="size-3 mt-0.5"/>
                        </Link>
                        <Button size="sm" variant="secondary" className="text-primary/90" onClick={() => setIsOpen(false)}>
                            Done
                        </Button>
                    </div>
                </div>

                {toast &&
                    <div className="absolute bottom-20 left-4 right-4 animate-in slide-in-from-bottom-2">
                        <div className={cn("p-2.5 rounded-lg border text-xs font-medium flex items-center gap-2 shadow-lg",
                            toast.type === "error" ? "bg-rose-500/10 border-rose-500/20 text-rose-400" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                        )}>
                            <TriangleAlert className="size-3.5"/>
                            {toast.message}
                        </div>
                    </div>
                }
            </CredenzaContent>
        </Credenza>
    );
};
