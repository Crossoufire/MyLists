import {cn} from "@/lib/utils/helpers";
import {useQuery} from "@tanstack/react-query";
import {Badge} from "@/lib/components/ui/badge";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {useEffect, useRef, useState} from "react";
import {Label, ToastType} from "@/lib/components/types";
import {MutedText} from "@/lib/components/general/MutedText";
import {LabelAction, MediaType} from "@/lib/server/utils/enums";
import {userMediaLabelsOptions} from "@/lib/react-query/query-options/query-options";
import {useEditUserLabelMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {CircleCheck, CirclePlus, LoaderCircle, Pen, Trash2, TriangleAlert, X} from "lucide-react";
import {Credenza, CredenzaContent, CredenzaDescription, CredenzaHeader, CredenzaTitle, CredenzaTrigger} from "@/lib/components/ui/credenza";


interface LabelsDialogProps {
    mediaId: number;
    mediaLabels: Label[];
    mediaType: MediaType;
    updateUserMediaLabels: (mediaLabels: Label[]) => void;
}


export const LabelsDialog = ({ mediaType, mediaId, mediaLabels, updateUserMediaLabels }: LabelsDialogProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [isEditing, setIsEditing] = useState(false);
    const [oldLabelName, setOldLabelName] = useState("");
    const [toast, setToast] = useState<ToastType | null>(null);
    const [editingLabelName, setEditingLabelName] = useState("");
    const [inputAddNewLabel, setInputAddNewLabel] = useState("");
    const editUserLabelMutation = useEditUserLabelMutation(mediaType, mediaId);
    const { data: allLabels = [], error, isLoading } = useQuery(userMediaLabelsOptions(mediaType, isOpen));

    useEffect(() => {
        error && showToast("An unexpected error occurred. Please try again later.", "error");
    }, [error]);

    useEffect(() => {
        if (isEditing) inputRef.current?.focus();
    }, [isEditing]);

    const showToast = (message: string, type: "error" | "success") => {
        setToast({ message, type });
    };

    const isLabelUnique = (name: string) => {
        return allLabels.filter((label) => label.name === name).length === 0;
    };

    const createNewLabel = (labelName: string) => {
        if (!isLabelUnique(labelName)) {
            return showToast("This label name already exists", "error");
        }

        editUserLabelMutation.mutate({ label: { name: labelName }, action: LabelAction.ADD }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: async (data: Label) => updateUserMediaLabels([...mediaLabels, data]),
            onSettled: () => setInputAddNewLabel(""),
        });
    };

    const removeFromMedia = (label: Label) => {
        editUserLabelMutation.mutate({ label, action: LabelAction.DELETE_ONE }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateUserMediaLabels(mediaLabels.filter(l => l.name !== label.name)),
        });
    };

    const renameMediaLabel = (newLabelName: string, oldLabel: Label) => {
        if (!newLabelName.trim() || newLabelName === oldLabel.name) {
            return setIsEditing(false);
        }

        const editedNewLabelName = newLabelName.trim();
        if (!isLabelUnique(editedNewLabelName)) {
            setIsEditing(false);
            return showToast("This label name already exists", "error");
        }

        const newLabel = { name: editedNewLabelName };

        editUserLabelMutation.mutate({ label: { oldName: oldLabel.name, name: editedNewLabelName }, action: LabelAction.RENAME }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => {
                if (mediaLabels.map(l => l.name).includes(oldLabel.name)) {
                    updateUserMediaLabels(mediaLabels.map(l => l.name === oldLabel.name ? newLabel : l));
                }
            },
            onSettled: () => {
                setOldLabelName("");
                setIsEditing(false);
                setEditingLabelName("");
            },
        });
    };

    const addLabelToMedia = (label: Label) => {
        if (mediaLabels.map(l => l.name).includes(label.name)) return;
        editUserLabelMutation.mutate({ label, action: LabelAction.ADD }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => updateUserMediaLabels([...mediaLabels, label]),
        });
    };

    const startEditingLabel = (label: Label) => {
        setIsEditing(!isEditing);
        setOldLabelName(label.name);
        setEditingLabelName(label.name);
    };

    const deleteLabelTotally = (label: Label) => {
        if (!window.confirm("Do you really want to delete this label?")) return;

        editUserLabelMutation.mutate({ label, action: LabelAction.DELETE_ALL }, {
            onError: () => showToast("An unexpected error occurred", "error"),
            onSuccess: () => {
                showToast("Label successfully deleted", "success");
                updateUserMediaLabels([...mediaLabels.filter(l => l.name !== label.name)]);
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
                            value={inputAddNewLabel}
                            disabled={editUserLabelMutation.isPending}
                            placeholder={"Create a new label"}
                            onChange={(ev) => setInputAddNewLabel(ev.target.value.trim())}
                            onKeyDown={(ev) => {
                                if (ev.key === "Enter") {
                                    const value = ev.currentTarget.value.trim();
                                    if (value) createNewLabel(value);
                                }
                            }}
                        />
                        <Button size="sm" onClick={() => createNewLabel(inputAddNewLabel)} disabled={editUserLabelMutation.isPending}>
                            <CirclePlus className="mr-2 h-4 w-4"/> Create
                        </Button>
                    </div>
                    <div className="space-y-2">
                        <h4 className="font-medium">Current Labels</h4>
                        <div className="flex flex-wrap items-center gap-2">
                            {mediaLabels.length === 0 ?
                                <MutedText className="text-sm">No labels added yet</MutedText>
                                :
                                mediaLabels.map((label) =>
                                    <Badge key={label.name}>
                                        {label.name}
                                        <div role="button" className="ml-2 hover:opacity-60" onClick={() => removeFromMedia(label)}>
                                            <X className="h-4 w-4"/>
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
                                <LoaderCircle className="h-6 w-6 animate-spin"/>
                                :
                                allLabels.length === 0 ?
                                    <MutedText className="text-sm">No labels created yet</MutedText>
                                    :
                                    allLabels.map((label) =>
                                        <li key={label.name} className="flex items-center justify-between text-sm">
                                            {(oldLabelName === label.name && isEditing) ?
                                                <Input
                                                    ref={inputRef}
                                                    className={"mr-2 w-52"}
                                                    value={editingLabelName}
                                                    disabled={editUserLabelMutation.isPending}
                                                    onChange={(ev) => setEditingLabelName(ev.target.value)}
                                                    onBlur={() => renameMediaLabel(editingLabelName, label)}
                                                    onKeyDown={(ev) => {
                                                        if (ev.key === "Enter") {
                                                            renameMediaLabel(editingLabelName, label);
                                                        }
                                                    }}
                                                />
                                                :
                                                <span>{label.name}</span>
                                            }
                                            <div>
                                                {!mediaLabels.map(l => l.name).includes(label.name) &&
                                                    <Button variant="ghost" size="icon" onClick={() => addLabelToMedia(label)}
                                                            disabled={editUserLabelMutation.isPending}>
                                                        <CirclePlus className="h-4 w-4"/>
                                                    </Button>
                                                }
                                                <Button variant="ghost" size="icon" onClick={() => startEditingLabel(label)}>
                                                    <Pen className="h-4 w-4"/>
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => deleteLabelTotally(label)}>
                                                    <Trash2 className="h-4 w-4"/>
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
                {type === "error" ? <TriangleAlert className="mr-3 h-4 w-4"/> : <CircleCheck className="mr-3 h-4 w-4"/>}
                <span>{message}</span>
            </div>
            <div role="button" onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="h-4 w-4"/>
            </div>
        </div>
    );
};
