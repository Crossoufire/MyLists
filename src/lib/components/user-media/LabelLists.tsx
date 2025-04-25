import {Link} from "@tanstack/react-router";
import {useAuth} from "@/lib/hooks/use-auth";
import {Badge} from "@/lib/components/ui/badge";
import {MediaType} from "@/lib/server/utils/enums";
import {useQueryClient} from "@tanstack/react-query";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/app/MutedText";
import {Label, LabelsDialog} from "@/lib/components/user-media/LabelsDialog";


interface LabelListsProps {
    mediaId: number;
    queryKey: string[];
    mediaLabels: Label[];
    mediaType: MediaType;
}


export const LabelLists = ({ queryKey, mediaType, mediaId, mediaLabels }: LabelListsProps) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const updateUserMediaLabels = (newLabelsList: Label[]) => {
        queryClient.setQueryData(queryKey, (oldData: any) => {
            if (queryKey[0] === "details") {
                return { ...oldData, userMedia: { ...oldData.userMedia, labels: newLabelsList } };
            }
            return {
                ...oldData,
                mediaData: oldData.mediaData.map((media: any) => (
                    media.mediaId === mediaId ? { ...media, labels: newLabelsList } : media
                ))
            }
        });
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Labels
                <LabelsDialog
                    mediaId={mediaId}
                    mediaType={mediaType}
                    mediaLabels={mediaLabels}
                    updateUserMediaLabels={updateUserMediaLabels}
                />
            </h4>
            <Separator/>
            <div className="flex flex-wrap gap-2">
                {mediaLabels.length === 0 ?
                    <MutedText className="text-sm">Not labels added yet</MutedText>
                    :
                    mediaLabels.map((label) =>
                        <Link
                            key={label.name}
                            to="/list/$mediaType/$username"
                            params={{ mediaType, username: currentUser!.name }}
                            search={{ labels: [label.name] }}
                        >
                            <Badge key={label.name}>
                                <div className="flex justify-between gap-2">{label.name}</div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
