import {Link} from "@tanstack/react-router";
import {Label} from "@/lib/types/base.types";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Badge} from "@/lib/client/components/ui/badge";
import {MediaType} from "@/lib/utils/enums";
import {useQueryClient} from "@tanstack/react-query";
import {Separator} from "@/lib/client/components/ui/separator";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {LabelsDialog} from "@/lib/client/components/media/base/LabelsDialog";
import {queryKeys} from "@/lib/client/react-query/query-options/query-options";
import {MediaDetailsOptionsType, MediaListOptionsType} from "@/lib/types/query.options.types";


interface LabelListsProps {
    mediaId: number;
    mediaLabels: Label[];
    mediaType: MediaType;
    queryKey: ReturnType<typeof queryKeys.userListKey> | ReturnType<typeof queryKeys.detailsKey>;
}


export const LabelLists = ({ queryKey, mediaType, mediaId, mediaLabels }: LabelListsProps) => {
    const { currentUser } = useAuth();
    const queryClient = useQueryClient();

    const updateUserMediaLabels = (newLabelsList: (Label | undefined)[]) => {
        if (queryKey[0] === "details") {
            queryClient.setQueryData<MediaDetailsOptionsType>(queryKey, (oldData) => {
                if (!oldData) return;
                return { ...oldData, userMedia: { ...oldData.userMedia, labels: newLabelsList } as any };
            })
        }
        else if (queryKey[0] === "userList") {
            //@ts-expect-error - Complex because union type but all have labels
            queryClient.setQueryData<MediaListOptionsType>(queryKey, (oldData) => {
                if (!oldData) return;

                return {
                    ...oldData,
                    results: {
                        ...oldData.results,
                        items: oldData.results.items.map((m) => m.mediaId === mediaId ? { ...m, labels: newLabelsList } : m)
                    },
                };
            });
        }
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
            <Separator className="mb-1"/>
            <div className="flex flex-wrap gap-2">
                {mediaLabels.length === 0 ?
                    <MutedText className="text-sm">No labels added yet</MutedText>
                    :
                    mediaLabels.map((label) =>
                        <Link
                            key={label.name}
                            to="/list/$mediaType/$username"
                            params={{ mediaType, username: currentUser!.name }}
                            search={{ labels: [label.name] }}
                        >
                            <Badge variant="label" key={label.name}>
                                <div className="flex justify-between gap-2">{label.name}</div>
                            </Badge>
                        </Link>
                    )
                }
            </div>
        </>
    );
};
