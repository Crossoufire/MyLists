import {Link} from "react-router-dom";
import {Fragment, useState} from "react";
import {Input} from "@/components/ui/input";
import {Badge} from "@/components/ui/badge";
import {useLoading} from "@/hooks/LoadingHook";
import {Tooltip} from "@/components/ui/tooltip";
import {useUser} from "@/providers/UserProvider";
import {Separator} from "@/components/ui/separator";
import {FormError} from "@/components/app/base/FormError.jsx";
import {FormButton} from "@/components/app/base/FormButton";
import {Dialog, DialogContent, DialogTitle, DialogTrigger} from "@/components/ui/dialog";


export const LabelLists = ({ mediaType, updatesAPI, initIn, initAvailable }) => {
    const { currentUser: { username } } = useUser();
    const [error, setError] = useState("");
    const [isLoading, handleLoading] = useLoading();
    const [labelsInList, setLabelsInList] = useState(initIn);
    const [newLabel, setNewLabel] = useState("");
    const [labelsToAdd, setLabelsToAdd] = useState(initAvailable);

    const handleCreateLabel = async () => {
        setError("");

        if (labelsInList.includes(newLabel) || labelsToAdd.includes(newLabel)) {
            setError("This label already exists");
        }

        if (newLabel.trim() !== "" && !labelsInList.includes(newLabel) && !labelsToAdd.includes(newLabel)) {
            setNewLabel("");
            setLabelsInList([...labelsInList, newLabel]);
            await handleLoading(updatesAPI.addMediaToLabel, newLabel);
        }
    };

    const handleMoveLabel = async (label, fromList) => {
        if (fromList === "inList") {
            setLabelsInList(labelsInList.filter(lab => lab !== label));
            setLabelsToAdd([...labelsToAdd, label]);
            await updatesAPI.removeLabelFromMedia(label);
        }

        if (fromList === "toAdd") {
            setLabelsToAdd(labelsToAdd.filter(lab => lab !== label));
            setLabelsInList([...labelsInList, label]);
            await updatesAPI.addMediaToLabel(label);
        }
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Labels
                <Dialog>
                    <Tooltip text="Manage labels">
                        <DialogTrigger asChild>
                            <span role="button" className="text-muted-foreground text-sm mt-2 italic">
                                Manage
                            </span>
                        </DialogTrigger>
                    </Tooltip>
                    <DialogContent className="max-sm:w-full w-[450px] max-h-[600px] overflow-y-auto gap-0">
                        <DialogTitle className="text-xl">Labels Manager</DialogTitle>
                        <div className="mt-7">
                            <h5 className="text-lg font-semibold">Already in</h5>
                            <Separator className="mt-1"/>
                            <div className="flex flex-wrap gap-3 justify-start">
                                {labelsInList.length === 0 ?
                                    <i className="text-muted-foreground">No labels added to this media yet</i>
                                    :
                                    labelsInList.map(lab =>
                                        <Badge key={lab} variant="label" onClick={() => handleMoveLabel(lab, "inList")}>
                                            {lab}
                                        </Badge>
                                    )
                                }
                            </div>
                        </div>
                        <div className="mt-7">
                            <h5 className="text-lg font-semibold">Add to</h5>
                            <Separator className="mt-1"/>
                            <div className="flex flex-wrap gap-3 justify-start">
                                {labelsToAdd.length === 0 ?
                                    <i className="text-muted-foreground">No labels available yet</i>
                                    :
                                    labelsToAdd.map(lab =>
                                        <Badge key={lab} variant="labelToAdd" onClick={() => handleMoveLabel(lab, "toAdd")}>
                                            {lab}
                                        </Badge>
                                    )
                                }
                            </div>
                        </div>
                        <div className="mt-7 mb-3">
                            <h5 className="text-lg font-semibold">Create a new label</h5>
                            <Separator className="mt-1"/>
                            <div>{error && <FormError message={error}/>}</div>
                            <div className="flex gap-4 mt-4">
                                <Input
                                    placeholder="Enter label name"
                                    value={newLabel}
                                    onChange={(ev) => setNewLabel(ev.target.value)}
                                    onKeyPress={(ev) => ev.key === "Enter" && handleCreateLabel()}
                                    disabled={isLoading}
                                />
                                <FormButton className="w-auto" onClick={handleCreateLabel} pending={isLoading}>
                                    Create
                                </FormButton>
                            </div>
                        </div>
                    </DialogContent>
                </Dialog>
            </h4>
            <Separator variant="large"/>
            <div className="flex flex-wrap gap-2">
                {labelsInList.length === 0 ?
                    <div className="text-muted-foreground italic">Not labels added yet</div>
                    :
                    labelsInList.map(lab =>
                        <Link key={lab} to={`/list/${mediaType}/${username}?status=Labels&label_name=${lab}`}>
                            <Badge key={lab} variant="label">
                                <div className="flex justify-between gap-2">{lab}</div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
