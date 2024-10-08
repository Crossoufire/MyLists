import {useAuth} from "@/hooks/AuthHook";
import {Fragment, useState} from "react";
import {Badge} from "@/components/ui/badge";
import {Link} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";
import {useQueryClient} from "@tanstack/react-query";
import {MutedText} from "@/components/app/base/MutedText";
import {LabelsDialog} from "@/components/app/LabelsDialog";


export const LabelLists = ({ mediaType, mediaId, labelsInList }) => {
    const queryClient = useQueryClient();
    const { currentUser: { username } } = useAuth();
    const [isOpen, setIsOpen] = useState(false);

    const updateLabelsInList = (labels) => {
        queryClient.setQueryData(["details", mediaType, mediaId.toString()], (oldData) => {
            return {
                ...oldData,
                user_media: {
                    ...oldData.user_media,
                    labels: {
                        ...oldData.user_media.labels,
                        already_in: labels,
                    }
                },
            };
        });
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Labels
                <MutedText className="text-sm mt-1">
                    <span role="button" onClick={() => setIsOpen(true)}>Manage</span>
                </MutedText>
                <LabelsDialog
                    isOpen={isOpen}
                    mediaId={mediaId}
                    labelsInList={labelsInList}
                    onClose={() => setIsOpen(false)}
                    updateLabelsInList={updateLabelsInList}
                />
            </h4>
            <Separator variant="large"/>
            <div className="flex flex-wrap gap-2">
                {labelsInList.length === 0 ?
                    <MutedText>Not labels added yet</MutedText>
                    :
                    labelsInList.map(name =>
                        <Link key={name} to={`/list/${mediaType}/${username}`} search={{ labels: [name] }}>
                            <Badge key={name} variant="label">
                                <div className="flex justify-between gap-2">{name}</div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
