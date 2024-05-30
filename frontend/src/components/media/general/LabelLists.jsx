import {Fragment, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {userClient} from "@/api/MyApiClient";
import {Tooltip} from "@/components/ui/tooltip";
import {Separator} from "@/components/ui/separator";
import {Link, useParams} from "@tanstack/react-router";
import {LabelsDialog} from "@/components/app/LabelsDialog";


export const LabelLists = ({ mediaId, alreadyIn }) => {
    const username = userClient.currentUser.username;
    const [isOpen, setIsOpen] = useState(false);
    const { mediaType } = useParams({strict: false });
    const [labelsInList, setLabelsInList] = useState(alreadyIn);

    const updateLabelsInList = (labels) => setLabelsInList(labels);

    const onClose = () => setIsOpen(false);

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Labels
                <Tooltip text="Manage Labels">
                    <span role="button" className="text-muted-foreground text-sm mt-2" onClick={() => setIsOpen(true)}>
                        <i>Manage</i>
                    </span>
                </Tooltip>
                <LabelsDialog
                    isOpen={isOpen}
                    onClose={onClose}
                    mediaId={mediaId}
                    labelsInList={labelsInList}
                    updateLabelsInList={updateLabelsInList}
                />
            </h4>
            <Separator variant="large"/>
            <div className="flex flex-wrap gap-2">
                {labelsInList.length === 0 ?
                    <div className="text-muted-foreground italic">Not labels added yet</div>
                    :
                    labelsInList.map(lab =>
                        <Link key={lab} to={`/list/${mediaType}/${username}?labels=${lab}`}>
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
