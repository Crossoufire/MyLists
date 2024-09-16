import {cn} from "@/utils/functions";
import {LuTrash, LuX} from "react-icons/lu";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {useQuery} from "@tanstack/react-query";
import {FaQuestionCircle} from "react-icons/fa";
import {useParams} from "@tanstack/react-router";
import {useEffect, useRef, useState} from "react";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {mediaLabelsOptions} from "@/api/queryOptions";
import {MutedText} from "@/components/app/base/MutedText";
import {FormButton} from "@/components/app/base/FormButton";
import {CheckIcon, ExclamationTriangleIcon} from "@radix-ui/react-icons";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Dialog, DialogContent, DialogDescription, DialogTitle} from "@/components/ui/dialog";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";
import {userLabelsMutations} from "@/api/mutations/labelsMutations";


export const LabelsDialog = ({ isOpen, onClose, mediaId, labelsInList, updateLabelsInList, manageOnly = false }) => {
    const inputRef = useRef();
    const { mediaType } = useParams({ strict: false });
    const [labelsToAdd, setLabelsToAdd] = useState([]);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");
    const [messageTab1, setMessageTab1] = useState({ type: "error", value: "" });
    const [messageTab2, setMessageTab2] = useState({ type: "error", value: "" });
    const { data, error, isLoading } = useQuery(mediaLabelsOptions(mediaType, mediaId, isOpen));
    const { addLabel, removeLabel, renameLabel, deleteLabel } = userLabelsMutations(mediaType, mediaId);

    useEffect(() => {
        if (isOpen) {
            if (error) {
                setMessageTab1({ type: "error", value: error.message });
            }
            else if (data) {
                updateLabelsInList(data.already_in);
                setLabelsToAdd(data.available);
            }
        }
        else {
            resetRenaming();
        }
    }, [isOpen, data, error]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleMoveLabel = async (label, fromList) => {
        setMessageTab1({ type: "error", value: "" });
        const isBeingAdded = (fromList === "toAdd");
        const mutation = isBeingAdded ? addLabel : removeLabel;
        const updatedLabelsInList = isBeingAdded ? [...labelsInList, label] : labelsInList.filter(l => l !== label);
        const updatedLabelsToAdd = isBeingAdded ? labelsToAdd.filter(l => l !== label) : [...labelsToAdd, label];

        updateLabelsInList(updatedLabelsInList);
        setLabelsToAdd(updatedLabelsToAdd);

        mutation.mutate({ payload: label }, {
            onError: () => {
                setLabelsToAdd(labelsToAdd);
                updateLabelsInList(labelsInList);
                setMessageTab1({ type: "error", value: "An unexpected error occurred" });
            },
        });
    };

    const handleOnRename = async () => {
        setMessageTab2({ ...messageTab2, value: "" });

        if (newLabelName < 1 || selectedLabel === newLabelName || isLabelDuplicate(newLabelName)) {
            resetRenaming();
            return setMessageTab2({
                type: "error",
                value: (newLabelName < 1 || selectedLabel === newLabelName) ?
                    "" : "This Label name already exists",
            });
        }

        renameLabel.mutate({ oldName: selectedLabel, newName: newLabelName }, {
            onError: () => setMessageTab2({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => {
                updateLabelsInList(labelsInList.map(x => (x === selectedLabel ? newLabelName : x)));
                setLabelsToAdd(labelsToAdd.map(x => (x === selectedLabel ? newLabelName : x)));
                setMessageTab2({ type: "success", value: "Label name successfully updated" });
            },
            onSettled: resetRenaming,
        });
    };

    const handleOnDelete = async (name) => {
        setMessageTab2({ ...messageTab2, value: "" });

        if (!window.confirm("Do you really want to delete this label?")) return;

        await deleteLabel.mutate({ name }, {
            onError: () => setMessageTab2({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => {
                setMessageTab2({ type: "success", value: "Label successfully deleted" });
                updateLabelsInList(labelsInList.filter(x => x !== name));
                setLabelsToAdd(labelsToAdd.filter(x => x !== name));
            },
        });
    };

    const resetRenaming = () => {
        setIsRenaming(false);
        setSelectedLabel("");
        setNewLabelName("");
    };

    const isLabelDuplicate = (label) => {
        return labelsInList.includes(label) || labelsToAdd.includes(label);
    };

    const labelClick = (label) => {
        setSelectedLabel(label);
        setIsRenaming(true);
        setNewLabelName(label);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-sm:w-[95%] w-[450px] h-[500px] rounded-lg">
                <div className="hidden">
                    <DialogTitle></DialogTitle>
                    <DialogDescription></DialogDescription>
                </div>
                <Tabs defaultValue={manageOnly ? "manage" : "edit"} className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit" disabled={manageOnly}>Edit Labels</TabsTrigger>
                        <TabsTrigger value="manage">Manage Labels</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                        <div className="space-y-8 mt-6">
                            {messageTab1.value && <FormMessage {...messageTab1} updateMessage={setMessageTab1}/>}
                            <LabelsList
                                title="Already In"
                                labelVariant="label"
                                labelsList={labelsInList}
                                noLabelsMessage="No labels added to this media yet"
                                moveCallback={(label) => handleMoveLabel(label, "inList")}
                            />
                            <LabelsList
                                title="Add To"
                                isLoading={isLoading}
                                labelsList={labelsToAdd}
                                labelVariant="labelToAdd"
                                noLabelsMessage="No more labels available"
                                moveCallback={(label) => handleMoveLabel(label, "toAdd")}
                            />
                            <LabelCreator
                                addLabel={addLabel}
                                labelsInList={labelsInList}
                                isLabelDuplicate={isLabelDuplicate}
                                updateLabelsList={updateLabelsInList}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="manage" className="overflow-y-auto max-h-[385px]">
                        {messageTab2.value && <FormMessage {...messageTab2} updateMessage={setMessageTab2} className="mt-4"/>}
                        <Table className="mt-3">
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="flex items-center gap-3">
                                        Name
                                        <Popover>
                                            <PopoverTrigger>
                                                <FaQuestionCircle/>
                                            </PopoverTrigger>
                                            <PopoverContent>
                                                Click on a label to rename it and press Enter to validate.
                                                If a label is not associated to at least 1 media it is automatically
                                                deleted.
                                            </PopoverContent>
                                        </Popover>
                                    </TableHead>
                                    <TableHead>Delete</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {[...labelsInList, ...labelsToAdd].map(label => (
                                    <LabelRow
                                        key={label}
                                        label={label}
                                        inputRef={inputRef}
                                        labelClick={labelClick}
                                        isRenaming={isRenaming}
                                        selectedLabel={selectedLabel}
                                        setIsRenaming={setIsRenaming}
                                        handleOnDelete={handleOnDelete}
                                        setNewLabelName={setNewLabelName}
                                        validateRenaming={(ev) => ev.key === "Enter" && handleOnRename()}
                                    />
                                ))}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};


const LabelRow = (props) => {
    const {
        label, isRenaming, selectedLabel, inputRef, setIsRenaming, validateRenaming, setNewLabelName, labelClick,
        handleOnDelete
    } = props;

    return (
        <TableRow key={label}>
            <TableCell className="w-[340px]">
                {(isRenaming && selectedLabel === label) ?
                    <Input
                        ref={inputRef}
                        defaultValue={selectedLabel}
                        onKeyPress={validateRenaming}
                        onBlur={() => setIsRenaming(false)}
                        className="p-0 m-0 border-none h-5 w-full"
                        onChange={(ev) => setNewLabelName(ev.target.value)}
                    />
                    :
                    <div role="button" onClick={() => labelClick(label)}>
                        {label}
                    </div>
                }
            </TableCell>
            <TableCell className="flex items-center justify-center">
                <div role="button" onClick={() => handleOnDelete(label)}>
                    <LuTrash/>
                </div>
            </TableCell>
        </TableRow>
    );
};


const LabelCreator = ({ labelsInList, isLabelDuplicate, updateLabelsList, addLabel }) => {
    const [newLabel, setNewLabel] = useState("");
    const [message, setMessage] = useState({ type: "error", value: "" });

    const createLabel = () => {
        setMessage({ type: "error", value: "" });
        if (isLabelDuplicate(newLabel)) {
            return setMessage({ type: "error", value: "This label already exists" });
        }
        addLabel.mutate({ payload: newLabel }, {
            onError: () => setMessage({ type: "error", value: "An unexpected error occurred" }),
            onSuccess: () => updateLabelsList([...labelsInList, newLabel]),
            onSettled: () => setNewLabel(""),
        });
    };

    const onKeyPress = async (ev) => {
        if (ev.key === "Enter") {
            await createLabel();
        }
    };

    return (
        <div>
            <h5 className="text-lg font-semibold">Create New Label</h5>
            <Separator className="mt-1"/>
            {message.value && <FormMessage {...message} updateMessage={setMessage}/>}
            <div className="flex gap-4 mt-4">
                <Input
                    value={newLabel}
                    onKeyPress={onKeyPress}
                    disabled={addLabel.isPending}
                    placeholder={"Create a new Label"}
                    onChange={(ev) => setNewLabel(ev.target.value)}
                />
                <FormButton className="w-auto" onClick={createLabel} disabled={addLabel.isPending || newLabel.trim() === ""}>
                    Create
                </FormButton>
            </div>
        </div>
    );
};


const LabelsList = ({ title, isLoading, labelsList, noLabelsMessage, labelVariant, moveCallback }) => {
    return (
        <div>
            <h5 className="text-lg font-semibold">{title}</h5>
            <Separator className="mt-1"/>
            <div className="flex flex-wrap gap-3 justify-start overflow-y-auto max-h-[75px]">
                {isLoading ?
                    <Loading/>
                    :
                    labelsList.length === 0 ?
                        <MutedText>{noLabelsMessage}</MutedText>
                        :
                        labelsList.map(label =>
                            <Badge key={label} variant={labelVariant} onClick={() => moveCallback(label)}>
                                {label}
                            </Badge>
                        )
                }
            </div>
        </div>
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
            {type === "error" ? <ExclamationTriangleIcon className="h-4 w-4"/> : <CheckIcon className="h-4 w-4"/>}
            <p>{value}</p>
            <div role="button" onClick={() => setIsVisible(false)} className="ml-auto">
                <LuX className="h-4 w-4"/>
            </div>
        </div>
    );
};
