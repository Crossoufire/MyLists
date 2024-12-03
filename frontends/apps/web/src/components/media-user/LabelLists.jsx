import {Fragment} from "react";
import {useAuth} from "@mylists/api";
import {Badge} from "@/components/ui/badge";
import {Link} from "@tanstack/react-router";
import {Separator} from "@/components/ui/separator";
import {useQueryClient} from "@tanstack/react-query";
import {MutedText} from "@/components/app/MutedText";
import {LabelsDialog} from "@/components/media-user/LabelsDialog";


export const LabelLists = ({ queryKey, mediaType, mediaId, mediaLabels }) => {
    const queryClient = useQueryClient();
    const { currentUser: { username } } = useAuth();

    const updateLabels = (oldData, newLabelsList) => {
        if (queryKey[0] === "details") {
            return { ...oldData, user_media: { ...oldData.user_media, labels: newLabelsList } };
        }
        return {
            ...oldData,
            media_data: oldData.media_data.map(m => {
                if (m.media_id !== mediaId) return m;
                return { ...m, labels: newLabelsList };
            })
        };
    };

    const updateMediaLabels = (newLabelsList) => {
        queryClient.setQueryData(queryKey, (oldData) => updateLabels(oldData, newLabelsList));
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Labels
                <LabelsDialog
                    mediaId={mediaId}
                    mediaType={mediaType}
                    mediaLabels={mediaLabels}
                    updateMediaLabels={updateMediaLabels}
                />
            </h4>
            <Separator variant="large"/>
            <div className="flex flex-wrap gap-2">
                {mediaLabels.length === 0 ?
                    <MutedText className="text-sm">Not labels added yet</MutedText>
                    :
                    mediaLabels.map(name =>
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
