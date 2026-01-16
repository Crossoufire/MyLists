import {useState} from "react";
import {cn} from "@/lib/utils/helpers";
import {Link} from "@tanstack/react-router";
import {useQuery} from "@tanstack/react-query";
import {capitalize} from "@/lib/utils/formating";
import {Collection} from "@/lib/types/base.types";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Badge} from "@/lib/client/components/ui/badge";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {CollectionAction, MediaType} from "@/lib/utils/enums";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {collectionNamesOptions} from "@/lib/client/react-query/query-options/query-options";
import {CircleCheck, CirclePlus, Layers, LoaderCircle, Plus, TriangleAlert, X} from "lucide-react";
import {useEditCollectionMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger} from "@/lib/client/components/ui/credenza";


type ToastType = { type: "error" | "success", message: string };


interface CollectionsDialogProps {
    mediaId: number;
    mediaType: MediaType;
    collections: Collection[];
    updateCollection: (collections: (Collection | undefined)[]) => void;
}


export const CollectionsDialog = ({ mediaType, mediaId, collections, updateCollection }: CollectionsDialogProps) => {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [newCollection, setNewCollection] = useState("");
    const [toast, setToast] = useState<ToastType | null>(null);
    const editUserCollectionMutation = useEditCollectionMutation(mediaType, mediaId);
    const { data: allCollections = [], isLoading } = useQuery(collectionNamesOptions(mediaType, isOpen));

    const showToast = (message: string, type: "error" | "success") => {
        setToast({ message, type });
    };

    const createNew = (name: string) => {
        const trimmed = name.trim();
        if (!trimmed) return;

        const isUnique = allCollections.filter((col) => col.name === trimmed).length === 0;
        if (!isUnique) {
            return showToast("This collection name already exists", "error");
        }

        editUserCollectionMutation.mutate({ collection: { name: trimmed }, action: CollectionAction.ADD }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: (data) => updateCollection([...collections, data]),
            onSettled: () => setNewCollection(""),
        });
    };

    const removeFromMedia = (collection: Collection) => {
        editUserCollectionMutation.mutate({ collection, action: CollectionAction.DELETE_ONE }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateCollection(collections.filter((c) => c.name !== collection.name)),
        });
    };

    const addToMedia = (collection: Collection) => {
        if (collections.map((c) => c.name).includes(collection.name)) return;
        editUserCollectionMutation.mutate({ collection, action: CollectionAction.ADD }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateCollection([...collections, collection]),
        });
    };

    return (
        <Credenza>
            <CredenzaTrigger onClick={() => setIsOpen(true)}>
                <div className="text-muted-foreground text-sm mt-1">
                    Manage
                </div>
            </CredenzaTrigger>
            <CredenzaContent className="w-100 max-sm:w-full">
                <CredenzaHeader>
                    <CredenzaTitle>
                        Your {capitalize(mediaType)} Collections
                    </CredenzaTitle>
                    <CredenzaDescription>
                        You can include this {mediaType} in collections or create new ones.
                    </CredenzaDescription>
                </CredenzaHeader>
                {toast &&
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast(null)}
                    />
                }
                <div className="space-y-8 mt-8 max-sm:mt-4 max-sm:p-6">
                    <div>
                        <Link to="/list/$mediaType/$username/collections" params={{ mediaType, username: currentUser!.name }}>
                            <Button variant="ghost" size="sm" className="h-8 gap-2 px-3 text-xs">
                                <Layers className="size-3.5"/>
                                View all collections
                            </Button>
                        </Link>
                    </div>
                    <div className="flex items-center gap-3">
                        <Input
                            autoFocus={true}
                            value={newCollection}
                            placeholder={"Create a collection..."}
                            disabled={editUserCollectionMutation.isPending}
                            onChange={(ev) => setNewCollection(ev.target.value)}
                            onKeyDown={(ev) => ev.key === "Enter" && createNew(ev.currentTarget.value)}
                        />
                        <Button
                            size="sm"
                            disabled={editUserCollectionMutation.isPending}
                            onClick={() => createNew(newCollection)}
                        >
                            <Plus className="size-4"/> Create
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">
                            In Collections
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                            {collections.length === 0 ?
                                <EmptyState
                                    icon={Layers}
                                    iconSize={20}
                                    message="Not in a collection yet."
                                />
                                :
                                collections.map((col) =>
                                    <Badge key={col.name} variant="emerald">
                                        {col.name}
                                        <div role="button" className="ml-2 hover:opacity-60" onClick={() => removeFromMedia(col)}>
                                            <X className="size-4"/>
                                        </div>
                                    </Badge>
                                )
                            }
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">
                            Available Collections
                        </h4>
                        <ul className="max-h-50 overflow-y-auto scrollbar-thin">
                            {isLoading ?
                                <LoaderCircle className="size-6 animate-spin"/>
                                :
                                allCollections.length === 0 ?
                                    <EmptyState
                                        icon={X}
                                        iconSize={20}
                                        message="No collections created yet."
                                    />
                                    :
                                    allCollections.map((col) =>
                                        <li key={col.name} className="flex items-center justify-between text-sm">
                                            <Badge
                                                variant={collections.map((c) => c.name).includes(col.name) ? "emerald" : "collectionToAdd"}
                                            >
                                                {col.name}
                                            </Badge>
                                            <div>
                                                {!collections.map((c) => c.name).includes(col.name) &&
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => addToMedia(col)}
                                                        disabled={editUserCollectionMutation.isPending}
                                                    >
                                                        <CirclePlus className="size-4"/>
                                                    </Button>
                                                }
                                            </div>
                                        </li>
                                    )}
                        </ul>
                    </div>
                </div>
            </CredenzaContent>
        </Credenza>
    );
};


interface ToastProps {
    message: string;
    onClose: () => void;
    type: "error" | "success";
}


const Toast = ({ message, type, onClose }: ToastProps) => {
    return (
        <div className={cn("flex items-center justify-between mt-4 p-2 rounded-md",
            type === "error" ? "bg-rose-500/10" : "bg-green-500/10")}>
            <div className="flex items-center text-sm">
                {type === "error" ? <TriangleAlert className="mr-3 size-4"/> : <CircleCheck className="mr-3 size-4"/>}
                <span>{message}</span>
            </div>
            <div role="button" onClick={onClose} className="text-muted-foreground hover:text-muted-foreground/50">
                <X className="size-4"/>
            </div>
        </div>
    );
};
