import {toast} from "sonner";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {UserMedia, UserMediaItem} from "@/lib/components/types";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {LabelLists} from "@/lib/components/media/base/LabelLists";
import {UpdateComment} from "@/lib/components/media/base/UpdateComment";
import {HistoryDetails} from "@/lib/components/media/base/HistoryDetails";
import {UpdateFavorite} from "@/lib/components/media/base/UpdateFavorite";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";
import {historyOptions, queryKeys} from "@/lib/react-query/query-options/query-options";
import {UserMediaSpecificDetails} from "@/lib/components/media/base/UserMediaSpecificDetails";
import {useRemoveMediaFromListMutation, useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface UserMediaDetailsProps {
    queryKey: string[];
    mediaType: MediaType;
    userMedia: UserMedia | UserMediaItem;
}


export const UserMediaDetails = ({ userMedia, mediaType, queryKey }: UserMediaDetailsProps) => {
    const queryClient = useQueryClient();
    const history = useQuery(historyOptions(mediaType, userMedia.mediaId)).data;
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);
    const removeMediaFromListMutation = useRemoveMediaFromListMutation(mediaType, userMedia.mediaId, queryKey);

    const handleRemoveMediaFromList = () => {
        if (!window.confirm(`Do you want to remove this ${mediaType} from your list?`)) return;
        removeMediaFromListMutation.mutate({}, {
            onSuccess: () => {
                toast.success(`${capitalize(mediaType)} removed from your list`);
                queryClient.removeQueries({ queryKey: queryKeys.historyKey(mediaType, userMedia.mediaId) });
            },
        });
    };

    return (
        <div className="space-y-2 w-[300px]">
            <Tabs defaultValue="yourInfo">
                <TabsList className="w-full items-center justify-between pr-3">
                    <div>
                        <TabsTrigger value="yourInfo">
                            Your Info
                        </TabsTrigger>
                        <TabsTrigger value="history" disabled={history?.length === 0}>
                            History ({history?.length})
                        </TabsTrigger>
                    </div>
                    <UpdateFavorite
                        isFavorite={userMedia.favorite}
                        updateFavorite={updateUserMediaMutation}
                    />
                </TabsList>
                <TabsContent value="yourInfo">
                    <div className="p-5 pt-3 bg-card rounded-md">
                        <UserMediaSpecificDetails
                            queryKey={queryKey}
                            mediaType={mediaType}
                            userMedia={userMedia as any}
                        />
                        <UpdateComment
                            content={userMedia.comment}
                            updateComment={updateUserMediaMutation}
                        />
                        <LabelLists
                            queryKey={queryKey}
                            mediaType={mediaType}
                            mediaId={userMedia.mediaId}
                            //@ts-expect-error
                            mediaLabels={userMedia?.labels ?? []}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="history" className="bg-card rounded-md overflow-y-auto max-h-[353px] p-5 pt-3">
                    <HistoryDetails
                        history={history ?? []}
                        queryKey={queryKeys.historyKey(mediaType, userMedia.mediaId)}
                    />
                </TabsContent>
            </Tabs>
            <Button variant="destructive" onClick={handleRemoveMediaFromList}>
                Remove from your list
            </Button>
        </div>
    );
};
