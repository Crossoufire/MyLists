import {toast} from "sonner";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {useQuery, useQueryClient} from "@tanstack/react-query";
import {LabelLists} from "@/lib/components/user-media/LabelLists";
import {UpdateComment} from "@/lib/components/user-media/UpdateComment";
import {HistoryDetails} from "@/lib/components/user-media/HistoryDetails";
import {UpdateFavorite} from "@/lib/components/user-media/UpdateFavorite";
import {historyOptions, queryKeys} from "@/lib/react-query/query-options";
import {MoviesUserDetails} from "@/lib/components/user-media/MoviesUserDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";
import {useRemoveMediaFromListMutation, useUpdateUserMediaMutation} from "@/lib/react-query/mutations/user-media.mutations";


interface UserMediaDetailsProps {
    userMedia: any;
    queryKey: string[];
    mediaType: MediaType;
}


const mediaComponentMap = (value: MediaType) => {
    const components = {
        series: MoviesUserDetails,
        anime: MoviesUserDetails,
        movies: MoviesUserDetails,
        games: MoviesUserDetails,
        books: MoviesUserDetails,
        manga: MoviesUserDetails,
    };
    return components[value];
};


export const UserMediaDetails = ({ userMedia, mediaType, queryKey }: UserMediaDetailsProps) => {
    const queryClient = useQueryClient();
    const MediaUserDetails = mediaComponentMap(mediaType);
    const history = useQuery(historyOptions(mediaType, userMedia.mediaId)).data;
    const updateUserMediaMutation = useUpdateUserMediaMutation(mediaType, userMedia.mediaId, queryKey);
    const removeMediaFromListMutation = useRemoveMediaFromListMutation(mediaType, userMedia.mediaId, queryKey);

    const handleRemoveMediaFromList = () => {
        if (!window.confirm("Do you want to remove this media from your list?")) return;
        removeMediaFromListMutation.mutate({}, {
            onSuccess: () => {
                toast.success("Media removed from your list");
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
                        <MediaUserDetails
                            queryKey={queryKey}
                            userMedia={userMedia}
                            mediaType={mediaType}
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
