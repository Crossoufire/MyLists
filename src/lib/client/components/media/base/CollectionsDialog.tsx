import {cn} from "@/lib/utils/helpers";
import {useQuery} from "@tanstack/react-query";
import {useEffect, useRef, useState} from "react";
import {Collection} from "@/lib/types/base.types";
import {Badge} from "@/lib/client/components/ui/badge";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {CollectionAction, MediaType} from "@/lib/utils/enums";
import {EmptyState} from "@/lib/client/components/general/EmptyState";
import {userCollectionsOptions} from "@/lib/client/react-query/query-options/query-options";
import {useEditUserCollectionMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {CircleCheck, CirclePlus, Layers, LoaderCircle, Pen, Plus, Trash2, TriangleAlert, X} from "lucide-react";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger} from "@/lib/client/components/ui/credenza";


type ToastType = { type: "error" | "success", message: string };


interface CollectionsDialogProps {
    mediaId: number;
    mediaType: MediaType;
    collections: Collection[];
    updateUserCollections: (collections: (Collection | undefined)[]) => void;
}


export const CollectionsDialog = ({ mediaType, mediaId, collections, updateUserCollections }: CollectionsDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [toast, setToast] = useState<ToastType | null>(null);
    const [oldCollectionName, setOldCollectionName] = useState("");
    const [editingCollectionName, setEditingCollectionName] = useState("");
    const [inputAddNewCollection, setInputAddNewCollection] = useState("");
    const editUserCollectionMutation = useEditUserCollectionMutation(mediaType, mediaId);
    const { data: allCollections = [], error, isLoading } = useQuery(userCollectionsOptions(mediaType, isOpen));

    useEffect(() => {
        if (error) showToast("An unexpected error occurred. Please try again later.", "error");
    }, [error]);

    const showToast = (message: string, type: "error" | "success") => {
        setToast({ message, type });
    };

    const isCollectionUnique = (name: string) => {
        return allCollections.filter((col) => col.name === name).length === 0;
    };

    const createNewCollection = (name: string) => {
        if (!isCollectionUnique(name)) {
            return showToast("This collection name already exists", "error");
        }

        editUserCollectionMutation.mutate({ collection: { name: name }, action: CollectionAction.ADD }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: (data: Collection | undefined) => updateUserCollections([...collections, data]),
            onSettled: () => setInputAddNewCollection(""),
        });
    };

    const removeFromMedia = (collection: Collection) => {
        editUserCollectionMutation.mutate({ collection, action: CollectionAction.DELETE_ONE }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateUserCollections(collections.filter((c) => c.name !== collection.name)),
        });
    };

    const renameMediaCollection = (newCollectionName: string, oldCollection: Collection) => {
        if (!newCollectionName.trim() || newCollectionName === oldCollection.name) {
            return setIsEditing(false);
        }

        const editedNewCollectionName = newCollectionName.trim();
        if (!isCollectionUnique(editedNewCollectionName)) {
            setIsEditing(false);
            return showToast("This collection name already exists", "error");
        }

        const newCollection = { name: editedNewCollectionName };

        editUserCollectionMutation.mutate({
            collection: { oldName: oldCollection.name, name: editedNewCollectionName },
            action: CollectionAction.RENAME,
        }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => {
                if (collections.map((c) => c.name).includes(oldCollection.name)) {
                    updateUserCollections(collections.map((c) => c.name === oldCollection.name ? newCollection : c));
                }
            },
            onSettled: () => {
                setIsEditing(false);
                setOldCollectionName("");
                setEditingCollectionName("");
            },
        });
    };

    const addCollectionToMedia = (collection: Collection) => {
        if (collections.map((c) => c.name).includes(collection.name)) return;
        editUserCollectionMutation.mutate({ collection, action: CollectionAction.ADD }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateUserCollections([...collections, collection]),
        });
    };

    const startEditingCollection = (collection: Collection) => {
        setIsEditing(!isEditing);
        setOldCollectionName(collection.name);
        setEditingCollectionName(collection.name);
    };

    const deleteCollectionTotally = (collection: Collection) => {
        if (!window.confirm("Do you really want to delete this collection?")) return;

        editUserCollectionMutation.mutate({ collection, action: CollectionAction.DELETE_ALL }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => {
                showToast("Collection successfully deleted", "success");
                updateUserCollections([...collections.filter((c) => c.name !== collection.name)]);
            },
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
                    <CredenzaTitle>Manage Collections</CredenzaTitle>
                    <CredenzaDescription>Here you can manage your collections.</CredenzaDescription>
                </CredenzaHeader>
                {toast &&
                    <Toast
                        type={toast.type}
                        message={toast.message}
                        onClose={() => setToast(null)}
                    />
                }
                <div className="space-y-8 mt-8 max-sm:mt-4 max-sm:p-6">
                    <div className="flex items-center gap-3">
                        <Input
                            autoFocus={true}
                            value={inputAddNewCollection}
                            placeholder={"Create a new collection"}
                            disabled={editUserCollectionMutation.isPending}
                            onChange={(ev) => setInputAddNewCollection(ev.target.value)}
                            onKeyDown={(ev) => {
                                if (ev.key === "Enter") {
                                    const value = ev.currentTarget.value.trim();
                                    if (value) createNewCollection(value);
                                }
                            }}
                        />
                        <Button
                            size="sm"
                            disabled={editUserCollectionMutation.isPending}
                            onClick={() => createNewCollection(inputAddNewCollection)}
                        >
                            <Plus className="size-4"/> Create
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">
                            Current Collections
                        </h4>
                        <div className="flex flex-wrap items-center gap-2">
                            {collections.length === 0 ?
                                <EmptyState
                                    icon={Layers}
                                    iconSize={22}
                                    message="No collections added yet."
                                />
                                :
                                collections.map((col) =>
                                    <Badge key={col.name} variant="collection">
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
                                        iconSize={25}
                                        message="No collections created yet."
                                    />
                                    :
                                    allCollections.map((col) =>
                                        <li key={col.name} className="flex items-center justify-between text-sm">
                                            {(oldCollectionName === col.name && isEditing) ?
                                                <Input
                                                    ref={inputRef}
                                                    className={"mr-2 w-52"}
                                                    value={editingCollectionName}
                                                    disabled={editUserCollectionMutation.isPending}
                                                    onChange={(ev) => setEditingCollectionName(ev.target.value)}
                                                    onBlur={() => renameMediaCollection(editingCollectionName, col)}
                                                    onKeyDown={(ev) => {
                                                        if (ev.key === "Enter") {
                                                            renameMediaCollection(editingCollectionName, col);
                                                        }
                                                    }}
                                                />
                                                :
                                                <Badge variant={collections.map((c) => c.name).includes(col.name)
                                                    ? "collection" : "collectionToAdd"
                                                }>
                                                    {col.name}
                                                </Badge>
                                            }
                                            <div>
                                                {!collections.map((c) => c.name).includes(col.name) &&
                                                    <Button
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => addCollectionToMedia(col)}
                                                        disabled={editUserCollectionMutation.isPending}
                                                    >
                                                        <CirclePlus className="size-4"/>
                                                    </Button>
                                                }
                                                <Button variant="ghost" size="icon" onClick={() => startEditingCollection(col)}>
                                                    <Pen className="size-4"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteCollectionTotally(col)}>
                                                    <Trash2 className="size-4"/>
                                                </Button>
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
