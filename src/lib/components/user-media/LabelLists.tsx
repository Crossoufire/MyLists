import {Link} from "@tanstack/react-router";
import {useAuth} from "@/lib/hooks/use-auth";
import {Badge} from "@/lib/components/ui/badge";
import {MediaType} from "@/lib/server/utils/enums";
import {useQueryClient} from "@tanstack/react-query";
import {Separator} from "@/lib/components/ui/separator";
import {MutedText} from "@/lib/components/app/MutedText";


interface LabelListsProps {
    queryKey: string[];
    mediaType: MediaType;
    mediaId: number | undefined;
    mediaLabels: { id: number, name: string }[];
}


export const LabelLists = ({ queryKey, mediaType, mediaId, mediaLabels }: LabelListsProps) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const updateLabels = (oldData: any, newLabelsList: any[]) => {
        if (queryKey[0] === "details") {
            return { ...oldData, userMedia: { ...oldData.userMedia, labels: newLabelsList } };
        }
        return {
            ...oldData,
            mediaData: oldData.mediaData.map((media: any) => {
                if (media.mediaId !== mediaId) return media;
                return { ...media, labels: newLabelsList };
            })
        };
    };

    const updateMediaLabels = (newLabelsList: any[]) => {
        queryClient.setQueryData(queryKey, (oldData: any) => updateLabels(oldData, newLabelsList));
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Labels
                {/*<LabelsDialog*/}
                {/*    mediaId={mediaId}*/}
                {/*    mediaType={mediaType}*/}
                {/*    mediaLabels={mediaLabels}*/}
                {/*    updateMediaLabels={updateMediaLabels}*/}
                {/*/>*/}
            </h4>
            <Separator/>
            <div className="flex flex-wrap gap-2">
                {mediaLabels.length === 0 ?
                    <MutedText className="text-sm">Not labels added yet</MutedText>
                    :
                    mediaLabels.map(label =>
                        <Link
                            key={label.id}
                            to="/list/$mediaType/$username"
                            params={{ mediaType, username: currentUser!.name }}
                            search={{ labels: [label.name] }}
                        >
                            <Badge key={label.id}>
                                <div className="flex justify-between gap-2">{label.name}</div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
