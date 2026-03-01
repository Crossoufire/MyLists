import {toast} from "sonner";
import {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/formating";
import {Card} from "@/lib/client/components/ui/card";
import {Button} from "@/lib/client/components/ui/button";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {TagsLists} from "@/lib/client/components/media/base/TagsLists";
import {UserMedia, UserMediaItem} from "@/lib/types/query.options.types";
import {TabHeader, TabItem} from "@/lib/client/components/general/TabHeader";
import {UpdateComment} from "@/lib/client/components/media/base/UpdateComment";
import {HistoryDetails} from "@/lib/client/components/media/base/HistoryDetails";
import {UpdateFavorite} from "@/lib/client/components/media/base/UpdateFavorite";
import {historyOptions} from "@/lib/client/react-query/query-options/query-options";
import {UserMediaSpecificDetails} from "@/lib/client/components/media/base/UserMediaSpecificDetails";
import {useRemoveMediaFromListMutation, UserMediaQueryOption, useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface UserMediaDetailsProps {
    mediaType: MediaType;
    queryOption: UserMediaQueryOption;
    userMedia: UserMedia | UserMediaItem;
}


export const UserMediaDetails = ({ userMedia, mediaType, queryOption }: UserMediaDetailsProps) => {
    const queryClient = useQueryClient();
    const history = useQuery(historyOptions(mediaType, userMedia.mediaId)).data;
    const removeMediaFromListMutation = useRemoveMediaFromListMutation(queryOption);
    const [activeTab, setActiveTab] = useState<"progress" | "history">("progress");
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

    const tabs: TabItem<"progress" | "history">[] = [
        {
            id: "progress",
            isAccent: true,
            label: "My Progress",
        },
        {
            id: "history",
            label: `History (${history?.length})`,
        },
    ]

    return (
        <Card className="bg-popover">
            <TabHeader tabs={tabs} activeTab={activeTab} setActiveTab={setActiveTab}>
                <UpdateFavorite
                    isFavorite={userMedia.favorite}
                    updateFavorite={updateUserMediaMutation}
                />
            </TabHeader>

            {activeTab === "progress" ?
                <div className="space-y-2 px-4 mt-1">
                    <UserMediaSpecificDetails
                        mediaType={mediaType}
                        userMedia={userMedia}
                        queryOption={queryOption}
                    />
                    <UpdateComment
                        content={userMedia.comment}
                        updateComment={updateUserMediaMutation}
                    />
                    <TagsLists
                        mediaType={mediaType}
                        queryOption={queryOption}
                        mediaId={userMedia.mediaId}
                        tags={userMedia?.tags ?? []}
                    />
                </div>
                :
                <div className="overflow-y-auto scrollbar-thin max-h-83 px-1">
                    <HistoryDetails
                        mediaType={mediaType}
                        history={history ?? []}
                        mediaId={userMedia.mediaId}
                    />
                </div>
            }

            <Button variant="destructive" className="w-full mt-4" onClick={handleRemoveMediaFromList}>
                Remove from your list
            </Button>
        </Card>
    );
};
