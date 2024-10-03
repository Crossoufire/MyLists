import {cn} from "@/utils/functions";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {mediaLabelsOptions} from "@/api/queryOptions";
import {Loading} from "@/components/app/base/Loading";
import {MutedText} from "@/components/app/base/MutedText";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {userLabelsMutations} from "@/api/mutations/labelsMutations";
import {LuAlertTriangle, LuCheckCircle, LuPen, LuPlusCircle, LuTrash2, LuX} from "react-icons/lu";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger} from "@/components/ui/credenza";


export const LabelsDialog = ({ mediaId, mediaType, mediaLabels, updateMediaLabels }) => {
    const inputRef = useRef();
    const queryClient = useQueryClient();
    const [oldName, setOldName] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingName, setEditingName] = useState("");
    const [newLabelName, setNewLabelName] = useState("");
    const [message, setMessage] = useState({ type: "error", value: "" });
    const { data: allLabels = [], error, isLoading } = useQuery(mediaLabelsOptions(mediaType, isOpen));
    const { addLabel, removeLabel, renameLabel, deleteLabel } = userLabelsMutations(mediaType, mediaId);

    useEffect(() => {
        error && setMessage({ type: "error", value: "An unexpected error occurred. Please try again later." });
    }, [error]);

    useEffect(() => {
        if (isEditing) {
            inputRef.current.focus();
        }
    }, [isEditing]);

    const isLabelUnique = (name) => {
        return !allLabels.includes(name);
    };

    const createLabel = () => {
        if (!newLabelName.trim()) return;
        const newLabel = newLabelName.trim();
        setMessage({ type: "error", value: "" });

        if (!isLabelUnique(newLabel)) {
            return setMessage({ type: "error", value: "This label name already exists" });
        }

        addLabel.mutate({ payload: newLabel }, {
            onError: () => setMessage({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: async () => {
                updateMediaLabels([...mediaLabels, newLabel]);
                queryClient.setQueryData(["labels", mediaType], (oldData) => {
                    return [...oldData, newLabel];
                });
            },
            onSettled: () => setNewLabelName(""),
        });
    };

    const removeFromMedia = (name) => {
        setMessage({ type: "error", value: "" });

        removeLabel.mutate({ payload: name }, {
            onError: () => setMessage({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => updateMediaLabels(mediaLabels.filter(l => l !== name)),
        });
    };

    const renameMediaLabel = () => {
        if (!editingName.trim() || editingName === oldName) {
            return setIsEditing(false);
        }

        const editedLabelName = editingName.trim();
        setMessage({ type: "error", value: "" });

        if (!isLabelUnique(editedLabelName)) {
            setIsEditing(false);
            return setMessage({ type: "error", value: "This label name already exists" });
        }

        renameLabel.mutate({ oldName: oldName, newName: editedLabelName }, {
            onError: () => setMessage({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => {
                if (mediaLabels.includes(oldName)) {
                    updateMediaLabels(mediaLabels.map(l => l === oldName ? editedLabelName : l));
                }
                queryClient.setQueryData(["labels", mediaType], (oldData) => {
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
            onError: () => setMessage({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => updateMediaLabels([...mediaLabels, name]),
        });
    };

    const startEditingLabel = (name) => {
        setOldName(name);
        setEditingName(name);
        setIsEditing(!isEditing);
    };

    const deleteLabelTotally = (name) => {
        setMessage({ type: "error", value: "" });
        if (!window.confirm("Do you really want to delete this label?")) return;

        deleteLabel.mutate({ name }, {
            onError: () => setMessage({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => {
                updateMediaLabels(mediaLabels.filter(l => l !== name));
                setMessage({ type: "success", value: "Label successfully deleted" });
                queryClient.setQueryData(["labels", mediaType], (oldData) => {
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
                <div className="space-y-8 mt-8 max-sm:mt-4 max-sm:p-6">
                    {message.value && <FormMessage {...message} updateMessage={setMessage}/>}
                    <div className="flex items-center gap-3">
                        <Input
                            value={newLabelName}
                            disabled={addLabel.isPending}
                            placeholder={"Create new label"}
                            onChange={(ev) => setNewLabelName(ev.target.value)}
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
                        <ul className="max-h-[220px] overflow-y-auto">
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
                                                    className="mr-2"
                                                    value={editingName}
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
                                                        <LuPlusCircle className="h-4 w-4"/>
                                                    </Button>
                                                }
                                                <Button variant="ghost" size="icon" onClick={() => startEditingLabel(name)}>
                                                    <LuPen className="h-4 w-4"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteLabelTotally(name)}>
                                                    <LuTrash2 className="h-4 w-4"/>
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


const FormMessage = ({ type, value, updateMessage }) => {
    const [isVisible, setIsVisible] = useState(true);
    const bgColor = type === "error" ? "bg-rose-500/10" : "bg-green-500/10";

    useEffect(() => {
        if (!isVisible) {
            updateMessage({ type: "error", value: "" });
        }
    }, [isVisible]);

    return (
        <div className={cn("p-3 rounded-md flex items-center gap-x-2 text-sm text-neutral-200", bgColor)}>
            {type === "error" ? <LuAlertTriangle/> : <LuCheckCircle/>}
            <p>{value}</p>
            <div role="button" onClick={() => setIsVisible(false)} className="ml-auto">
                <LuX className="h-4 w-4"/>
            </div>
        </div>
    );
};