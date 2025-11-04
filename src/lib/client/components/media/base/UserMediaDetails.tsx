import {toast} from "sonner";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/client/components/ui/button";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {LabelLists} from "@/lib/client/components/media/base/LabelLists";
import {UserMedia, UserMediaItem} from "@/lib/types/query.options.types";
import {UpdateComment} from "@/lib/client/components/media/base/UpdateComment";
import {HistoryDetails} from "@/lib/client/components/media/base/HistoryDetails";
import {UpdateFavorite} from "@/lib/client/components/media/base/UpdateFavorite";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/client/components/ui/tabs";
import {UserMediaSpecificDetails} from "@/lib/client/components/media/base/UserMediaSpecificDetails";
import {historyOptions} from "@/lib/client/react-query/query-options/query-options";
import {ModifyUserMedia, useRemoveMediaFromListMutation, useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UserMediaDetailsProps {
    mediaType: MediaType;
    queryOption: ModifyUserMedia;
    userMedia: UserMedia | UserMediaItem;
}


export const UserMediaDetails = ({ userMedia, mediaType, queryOption }: UserMediaDetailsProps) => {
    const queryClient = useQueryClient();
    const history = useQuery(historyOptions(mediaType, userMedia.mediaId)).data;
    const removeMediaFromListMutation = useRemoveMediaFromListMutation(queryOption);
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryOption);

    const handleRemoveMediaFromList = () => {
        if (!window.confirm(`Do you want to remove this ${mediaType} from your list?`)) return;
        removeMediaFromListMutation.mutate({ data: { mediaType, mediaId: userMedia.mediaId } }, {
            onSuccess: () => {
                toast.success(`${capitalize(mediaType)} removed from your list`);
                queryClient.removeQueries({ queryKey: historyOptions(mediaType, userMedia.mediaId).queryKey });
            },
        });
    };

    return (
        <div className="space-y-2 w-[300px]">
            <Tabs defaultValue="yourInfo">
                <TabsList className="w-full items-center justify-between pr-2">
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
                            mediaType={mediaType}
                            queryOption={queryOption}
                            userMedia={userMedia as any}
                        />
                        <UpdateComment
                            content={userMedia.comment}
                            updateComment={updateUserMediaMutation}
                        />
                        <LabelLists
                            mediaType={mediaType}
                            queryOption={queryOption}
                            mediaId={userMedia.mediaId}
                            mediaLabels={userMedia?.labels ?? []}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="history" className="bg-card rounded-md overflow-y-auto max-h-[353px] p-3 px-5">
                    <HistoryDetails
                        mediaType={mediaType}
                        history={history ?? []}
                        mediaId={userMedia.mediaId}
                    />
                </TabsContent>
            </Tabs>
            <Button variant="destructive" className="w-full" onClick={handleRemoveMediaFromList}>
                Remove from your list
            </Button>
        </div>
    );
};
