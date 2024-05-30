import {cn} from "@/lib/utils";
import {api} from "@/api/MyApiClient";
import {LuTrash, LuX} from "react-icons/lu";
import {Badge} from "@/components/ui/badge";
import {Input} from "@/components/ui/input";
import {useLoading} from "@/hooks/LoadingHook";
import {FaQuestionCircle} from "react-icons/fa";
import {useParams} from "@tanstack/react-router";
import {useEffect, useRef, useState} from "react";
import {Separator} from "@/components/ui/separator";
import {Loading} from "@/components/app/base/Loading";
import {useApiUpdater} from "@/hooks/UserUpdaterHook";
import {FormButton} from "@/components/app/base/FormButton";
import {Dialog, DialogContent} from "@/components/ui/dialog";
import {CheckIcon, ExclamationTriangleIcon} from "@radix-ui/react-icons";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";
import {Table, TableBody, TableCell, TableHead, TableHeader, TableRow} from "@/components/ui/table";


export const LabelsDialog = ({ isOpen, onClose, mediaId, labelsInList, updateLabelsInList, manageOnly = false }) => {
    const inputRef = useRef();
    const [_, handlePending] = useLoading();
    const { mediaType } = useParams({strict: false });
    const [loading, setLoading] = useState(false);
    const [labelsToAdd, setLabelsToAdd] = useState([]);
    const [isRenaming, setIsRenaming] = useState(false);
    const [newLabelName, setNewLabelName] = useState("");
    const [selectedLabel, setSelectedLabel] = useState("");
    const [listMessage, setListMessage] = useState({type: "error", value: ""});
    const [messageTab2, setMessageTab2] = useState({type: "error", value: ""});
    const { addMediaToLabel, removeLabelFromMedia } = useApiUpdater(mediaId, mediaType);

    useEffect(() => {
        if (isOpen) {
            (async () => {
                try {
                    setLoading(true);
                    const response = await api.get(`/labels_for_media/${mediaType}/${mediaId}`);
                    if (!response.ok) {
                        return setListMessage({ type: "error", value: "Sorry, an error occurred while fetching the labels" })
                    }
                    updateLabelsInList(response.body.data.already_in);
                    setLabelsToAdd(response.body.data.available);
                    console.log(response);
                }
                finally {
                    setLoading(false);
                }
            })();
        }
        else {
            resetRenaming();
        }
    }, [isOpen, mediaId]);

    useEffect(() => {
        if (isRenaming && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isRenaming]);

    const handleMoveLabel = async (label, fromList) => {
        setListMessage({ type: "error", value: "" });

        if (fromList === "inList") {
            updateLabelsInList(labelsInList.filter(lab => lab !== label));
            setLabelsToAdd([...labelsToAdd, label]);
            const response = await handlePending(removeLabelFromMedia, label, false);
            if (!response) {
                updateLabelsInList(labelsInList);
                setLabelsToAdd(labelsToAdd);
                setListMessage({ type: "error", value: "An unexpected error occurred" });
            }
        }

        if (fromList === "toAdd") {
            setLabelsToAdd(labelsToAdd.filter(lab => lab !== label));
            updateLabelsInList([...labelsInList, label]);
            const response = await handlePending(addMediaToLabel, label, false);
            if (!response) {
                setLabelsToAdd(labelsToAdd);
                updateLabelsInList(labelsInList);
                setListMessage({ type: "error", value: "An unexpected error occurred" });
            }
        }
    };

    const handleOnRename = async () => {
        setMessageTab2({ ...messageTab2, value: "" });

        if (newLabelName < 1 || selectedLabel === newLabelName|| isLabelDuplicate(newLabelName)) {
            resetRenaming();
            return setMessageTab2( {
                type: "error",
                value: (newLabelName < 1 || selectedLabel === newLabelName) ? "" : "This Label name already exists",
            });
        }

        const response = await api.post("/rename_label", {
            media_type: mediaType,
            old_label_name: selectedLabel,
            new_label_name: newLabelName,
        });

        if (!response.ok) {
            resetRenaming();
            return setMessageTab2({ type: "error", value: response.body.description });
        }

        setMessageTab2({ type: "success", value: "Label name successfully updated" });
        updateLabelsInList(labelsInList.map(x => (x === selectedLabel ? newLabelName : x)));
        setLabelsToAdd(labelsToAdd.map(x => (x === selectedLabel ? newLabelName : x)));
        resetRenaming();
    };

    const handleOnDelete = async (label) => {
        setMessageTab2({ ...messageTab2, value: "" });

        if (!window.confirm("Do you really want to delete this label?")) return;

        const response = await api.post("/delete_label", {
            media_type: mediaType,
            label: label
        });

        if (!response.ok) {
            return setMessageTab2({ type: "error", value: response.body.description });
        }

        setMessageTab2({ type: "success", value: "Label successfully deleted" });
        updateLabelsInList(labelsInList.filter(x => x !== label));
        setLabelsToAdd(labelsToAdd.filter(x => x !== label));
    };

    const resetRenaming = () => {
        setIsRenaming(false);
        setSelectedLabel("");
        setNewLabelName("");
    };

    const validateRenaming = async (ev) => {
        if (ev.key === "Enter") {
            await handleOnRename();
        }
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
                <Tabs defaultValue={manageOnly ? "manage" : "edit"} className="mt-6">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="edit" disabled={manageOnly}>Edit Labels</TabsTrigger>
                        <TabsTrigger value="manage">Manage Labels</TabsTrigger>
                    </TabsList>
                    <TabsContent value="edit">
                        <div className="space-y-8 mt-6">
                            {listMessage.value && <FormMessage {...listMessage} setMessage={setListMessage}/>}
                            <LabelsList
                                title="Already In"
                                labelVariant="label"
                                labelsList={labelsInList}
                                noLabelsMessage="No labels added to this media yet"
                                moveCallback={(label) => handleMoveLabel(label, "inList")}
                            />
                            <LabelsList
                                title="Add To"
                                loading={loading}
                                labelsList={labelsToAdd}
                                labelVariant="labelToAdd"
                                noLabelsMessage="No more labels available"
                                moveCallback={(label) => handleMoveLabel(label, "toAdd")}
                            />
                            <LabelCreator
                                addLabel={addMediaToLabel}
                                labelsInList={labelsInList}
                                isLabelDuplicate={isLabelDuplicate}
                                updateLabelsList={updateLabelsInList}
                            />
                        </div>
                    </TabsContent>
                    <TabsContent value="manage" className="overflow-y-auto max-h-[385px]">
                        {messageTab2.value && <FormMessage {...messageTab2} setMessage={setMessageTab2} className="mt-4"/>}
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
                                {labelsInList.map(label =>
                                    <LabelRow
                                        label={label}
                                        inputRef={inputRef}
                                        labelClick={labelClick}
                                        isRenaming={isRenaming}
                                        selectedLabel={selectedLabel}
                                        setIsRenaming={setIsRenaming}
                                        handleOnDelete={handleOnDelete}
                                        setNewLabelName={setNewLabelName}
                                        validateRenaming={validateRenaming}
                                    />
                                )}
                                {labelsToAdd.map(label =>
                                    <LabelRow
                                        label={label}
                                        inputRef={inputRef}
                                        labelClick={labelClick}
                                        isRenaming={isRenaming}
                                        selectedLabel={selectedLabel}
                                        setIsRenaming={setIsRenaming}
                                        handleOnDelete={handleOnDelete}
                                        setNewLabelName={setNewLabelName}
                                        validateRenaming={validateRenaming}
                                    />
                                )}
                            </TableBody>
                        </Table>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
    );
};


const LabelRow = (props) => {
    const { label, isRenaming, selectedLabel, inputRef, setIsRenaming, validateRenaming, setNewLabelName, labelClick,
        handleOnDelete } = props;

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
    const [isPending, handlePending] = useLoading();
    const [newLabel, setNewLabel] = useState("");
    const [message, setMessage] = useState({ type: "error", value: "" });

    const createLabel = async () => {
        setMessage({ type: "error", value: "" });

        try {
            if (isLabelDuplicate(newLabel)) {
                return setMessage({ type: "error", value: "This label already exists" });
            }

            const response = await handlePending(addLabel, newLabel, false);
            if (response) {
                updateLabelsList([...labelsInList, newLabel]);
            }
            else {
                setMessage({ type: "error", value: "An unexpected error occurred" });
            }
        }
        finally {
            setNewLabel("");
        }
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
            {message.value && <FormMessage {...message} setMessage={setMessage}/>}
            <div className="flex gap-4 mt-4">
                <Input
                    value={newLabel}
                    disabled={isPending}
                    onKeyPress={onKeyPress}
                    placeholder="Create a new Label"
                    onChange={(ev) => setNewLabel(ev.target.value)}
                />
                <FormButton className="w-auto" onClick={createLabel} pending={isPending || newLabel.trim() === ""}>
                    Create
                </FormButton>
            </div>
        </div>
    );
};


const LabelsList = ({ title, loading, labelsList, noLabelsMessage, labelVariant, moveCallback }) => {
    return (
        <div>
            <h5 className="text-lg font-semibold">{title}</h5>
            <Separator className="mt-1"/>
            <div className="flex flex-wrap gap-3 justify-start overflow-y-auto max-h-[75px]">
                {loading ?
                    <Loading/>
                    :
                    labelsList.length === 0 ?
                        <i className="text-muted-foreground">{noLabelsMessage}</i>
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


const FormMessage = ({ type, value, setMessage }) => {
    const [isVisible, setIsVisible] = useState(true);
    const bgColor = type === "error" ? "bg-rose-500/10" : "bg-green-500/10";

    if (!isVisible) {
        setMessage({type: "error", value: ""});
        return null;
    }

    return (
        <div className={cn("p-3 rounded-md flex items-center gap-x-2 text-sm text-neutral-200", bgColor)}>
            {type === "error" ?
                <ExclamationTriangleIcon className="h-4 w-4"/>
                :
                <CheckIcon className="h-4 w-4"/>
            }
            <p>{value}</p>
            <div role="button" onClick={() => setIsVisible(false)} className="ml-auto">
                <LuX className="h-4 w-4"/>
            </div>
        </div>
    );
};
