import {cn} from "@/utils/functions";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {Loading} from "@/components/app/Loading";
import {useEffect, useRef, useState} from "react";
import {MutedText} from "@/components/app/MutedText";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {mediaLabelsOptions, queryKeys, userLabelsMutations} from "@mylists/api";
import {LuAlertTriangle, LuCheckCircle, LuPen, LuPlusCircle, LuTrash2, LuX} from "react-icons/lu";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger} from "@/components/ui/credenza";


export const LabelsDialog = ({ mediaId, mediaType, mediaLabels, updateMediaLabels }) => {
    const inputRef = useRef();
    const queryClient = useQueryClient();
    const [toast, setToast] = useState(null);
    const [oldName, setOldName] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState("");
    const [newLabelName, setNewLabelName] = useState("");
    const { data: allLabels = [], error, isLoading } = useQuery(mediaLabelsOptions(mediaType, isOpen));
    const { addLabel, removeLabel, renameLabel, deleteLabel } = userLabelsMutations(mediaType, mediaId);

    useEffect(() => {
        error && showToast("An unexpected error occurred. Please try again later.", "error");
    }, [error]);

    useEffect(() => {
        if (isEditing) {
            // noinspection JSUnresolvedReference
            inputRef.current.focus();
        }
    }, [isEditing]);

    const showToast = (message, type) => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 4000);
    };

    const isLabelUnique = (name) => {
        return !allLabels.includes(name);
    };

    const createLabel = () => {
        if (!newLabelName.trim()) return;
        const newLabel = newLabelName.trim();

        if (!isLabelUnique(newLabel)) {
            return showToast("This label name already exists", "error");
        }

        addLabel.mutate({ payload: newLabel }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: async () => {
                updateMediaLabels([...mediaLabels, newLabel]);
                queryClient.setQueryData(queryKeys.labelsKey(mediaType), (oldData) => [...oldData, newLabel]);
            },
            onSettled: () => setNewLabelName(""),
        });
    };

    const removeFromMedia = (name) => {
        removeLabel.mutate({ payload: name }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateMediaLabels(mediaLabels.filter(l => l !== name)),
        });
    };

    const renameMediaLabel = () => {
        if (!editingName.trim() || editingName === oldName) {
            return setIsEditing(false);
        }

        const editedLabelName = editingName.trim();

        if (!isLabelUnique(editedLabelName)) {
            setIsEditing(false);
            return showToast("This label name already exists", "error");
        }

        renameLabel.mutate({ oldName: oldName, newName: editedLabelName }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => {
                if (mediaLabels.includes(oldName)) {
                    updateMediaLabels(mediaLabels.map(l => l === oldName ? editedLabelName : l));
                }
                queryClient.setQueryData(queryKeys.labelsKey(mediaType), (oldData) => {
                    return oldData.map(l => l === oldName ? editedLabelName : l);
                });
            },
            onSettled: () => {
                setOldName("");
                setEditingName("");
                setIsEditing(false);
            },
        });
    };

    const addLabelToMedia = (name) => {
        if (mediaLabels.includes(name)) return;
        addLabel.mutate({ payload: name }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateMediaLabels([...mediaLabels, name]),
        });
    };

    const startEditingLabel = (name) => {
        setOldName(name);
        setEditingName(name);
        setIsEditing(!isEditing);
    };

    const deleteLabelTotally = (name) => {
        if (!window.confirm("Do you really want to delete this label?")) return;

        deleteLabel.mutate({ name }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => {
                updateMediaLabels(mediaLabels.filter(l => l !== name));
                showToast("Label successfully deleted", "success");
                queryClient.setQueryData(queryKeys.labelsKey(mediaType), (oldData) => {
                    return oldData.filter(l => l !== name);
                });
            },
        });
    };

    return (
        <Credenza>
            <CredenzaTrigger onClick={() => setIsOpen(true)}>
                <MutedText className="text-sm mt-1">Manage</MutedText>
            </CredenzaTrigger>
            <CredenzaContent>
                <CredenzaHeader>
                    <CredenzaTitle>Manage Labels</CredenzaTitle>
                    <CredenzaDescription>Here you can manage your labels.</CredenzaDescription>
                </CredenzaHeader>
                {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)}/>}
                <div className="space-y-8 mt-8 max-sm:mt-4 max-sm:p-6">
                    <div className="flex items-center gap-3">
                        <Input
                            value={newLabelName}
                            disabled={addLabel.isPending}
                            placeholder={"Create a new label"}
                            onChange={(ev) => setNewLabelName(ev.target.value)}
                            onKeyPress={(ev) => ev.key === "Enter" && createLabel()}
                        />
                        <Button size="sm" onClick={createLabel} disabled={addLabel.isPending}>
                            <LuPlusCircle className="mr-2"/> Create
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">Current Labels</h4>
                        <div className="flex flex-wrap items-center gap-2">
                            {mediaLabels.length === 0 ?
                                <MutedText className="text-sm">No labels added yet</MutedText>
                                :
                                mediaLabels.map(name =>
                                    <Badge key={name} variant="label">
                                        {name}
                                        <div role="button" className="ml-2 hover:opacity-60" onClick={() => removeFromMedia(name)}>
                                            <LuX/>
                                        </div>
                                    </Badge>
                                )
                            }
                        </div>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">All Labels</h4>
                        <ul className="max-h-[200px] overflow-y-auto">
                            {isLoading ?
                                <Loading/>
                                :
                                allLabels.length === 0 ?
                                    <MutedText className="text-sm">No labels created yet</MutedText>
                                    :
                                    allLabels.map(name =>
                                        <li key={name} className="flex items-center justify-between text-sm">
                                            {(oldName === name && isEditing) ?
                                                <Input
                                                    ref={inputRef}
                                                    value={editingName}
                                                    className={"mr-2 w-52"}
                                                    disabled={renameLabel.isPending}
                                                    onBlur={() => renameMediaLabel()}
                                                    onChange={(ev) => setEditingName(ev.target.value)}
                                                    onKeyPress={(ev) => ev.key === "Enter" && renameMediaLabel()}
                                                />
                                                :
                                                <span>{name}</span>
                                            }
                                            <div>
                                                {!mediaLabels.includes(name) &&
                                                    <Button variant="ghost" size="icon" onClick={() => addLabelToMedia(name)}
                                                            disabled={addLabel.isPending}>
                                                        <LuPlusCircle/>
                                                    </Button>
                                                }
                                                <Button variant="ghost" size="icon" onClick={() => startEditingLabel(name)}>
                                                    <LuPen/>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteLabelTotally(name)}>
                                                    <LuTrash2/>
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


const Toast = ({ message, type, onClose }) => {
    return (
        <div className={cn("flex items-center justify-between mt-4 p-2 rounded-md",
            type === "error" ? "bg-rose-500/10" : "bg-green-500/10")}>
            <div className="flex items-center text-sm">
                {type === "error" ? <LuAlertTriangle className="mr-3"/> : <LuCheckCircle className="mr-3"/>}
                <span>{message}</span>
            </div>
            <div role="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <LuX/>
            </div>
        </div>
    );
};
