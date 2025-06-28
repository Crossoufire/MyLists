import {toast} from "sonner";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {mediaConfig} from "@/lib/components/media-config";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {LabelLists} from "@/lib/components/user-media/base/LabelLists";
import {UpdateComment} from "@/lib/components/user-media/base/UpdateComment";
import {HistoryDetails} from "@/lib/components/user-media/base/HistoryDetails";
import {UpdateFavorite} from "@/lib/components/user-media/base/UpdateFavorite";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";
import {historyOptions, mediaDetailsOptions, queryKeys} from "@/lib/react-query/query-options/query-options";
import {useRemoveMediaFromListMutation, useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface MediaSpecificDetailsProps<T extends MediaType> {
    mediaType: T;
    queryKey: string[];
    userMedia: ExtractUserMediaByType<T>;
}


type UserMedia = Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["userMedia"];


export type ExtractUserMediaByType<T extends MediaType> =
    T extends typeof MediaType.GAMES ? Extract<NonNullable<UserMedia>, { playtime: number | null }> :
        T extends typeof MediaType.SERIES | typeof MediaType.ANIME ? Extract<NonNullable<UserMedia>, { currentSeason: number }> :
            T extends typeof MediaType.MOVIES ? Exclude<NonNullable<UserMedia>, { playtime: number | null } | { currentSeason: number }> :
                never;


interface UserMediaDetailsProps {
    queryKey: string[];
    mediaType: MediaType;
    userMedia: NonNullable<UserMedia>;
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
                        <MediaSpecificDetails
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


const MediaSpecificDetails = <T extends MediaType>({ mediaType, userMedia, queryKey }: MediaSpecificDetailsProps<T>) => {
    const SpecificComponent = mediaConfig[mediaType].mediaUserDetails;

    return (
        <SpecificComponent
            queryKey={queryKey}
            mediaType={mediaType}
            userMedia={userMedia}
        />
    );
}