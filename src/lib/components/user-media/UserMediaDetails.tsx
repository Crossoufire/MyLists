import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {LabelLists} from "@/lib/components/user-media/LabelLists";
import {UpdateComment} from "@/lib/components/user-media/UpdateComment";
import {UpdateFavorite} from "@/lib/components/user-media/UpdateFavorite";
import {MoviesUserDetails} from "@/lib/components/user-media/MoviesUserDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";


interface UserMediaDetailsProps {
    queryKey: string[];
    mediaType: MediaType;
    userMedia: any //Awaited<ReturnType<NonNullable<ReturnType<typeof mediaDetailsOptions>["queryFn"]>>>["userMedia"];
}


const mediaComponentMap = (value: MediaType) => {
    const components = {
        movies: MoviesUserDetails,
    };
    //@ts-expect-error
    return components[value];
};


export const UserMediaDetails = ({ userMedia, mediaType, queryKey }: UserMediaDetailsProps) => {
    // const queryClient = useQueryClient();
    const MediaUserDetails = mediaComponentMap(mediaType);
    // const { data: history } = useQuery(historyOptions(mediaType, userMedia.mediaId));
    // const removeFromList = useRemoveMediaFromListMutation(mediaType, userMedia.mediaId, queryKey);
    // const { updateFavorite, updateComment } = useUserMediaMutations(mediaType, userMedia.mediaId, queryKey);

    const handleDeleteMedia = () => {
        if (!window.confirm("Do you want to remove this media from your list?")) return;
        // removeFromList.mutate(undefined, {
        //     onSuccess: () => {
        //         toast.success("Media removed from your list");
        //         queryClient.removeQueries({ queryKey: queryKeys.historyKey(mediaType, userMedia.mediaId) });
        //     },
        // });
    };

    return (
        <div className="space-y-2 w-[300px]">
            <Tabs defaultValue="yourInfo">
                <TabsList className="w-full items-center justify-between pr-3">
                    <div>
                        <TabsTrigger value="yourInfo">
                            Your Info
                        </TabsTrigger>
                        {/*<TabsTrigger value="history" disabled={history.length === 0}>*/}
                        {/*    History ({history.length})*/}
                        {/*</TabsTrigger>*/}
                    </div>
                    <UpdateFavorite
                        // updateFavorite={updateFavorite}
                        isFavorite={userMedia?.favorite}
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
                            content={userMedia?.comment}
                            // updateComment={updateComment}
                        />
                        <LabelLists
                            queryKey={queryKey}
                            mediaType={mediaType}
                            mediaId={userMedia?.mediaId}
                            mediaLabels={userMedia?.labels ?? []}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="history" className="bg-card rounded-md overflow-y-auto max-h-[353px] p-5 pt-3">
                    {/*<HistoryDetails*/}
                    {/*    history={history}*/}
                    {/*    queryKey={queryKeys.historyKey(mediaType, userMedia.mediaId)}*/}
                    {/*/>*/}
                </TabsContent>
            </Tabs>
            <Button variant="destructive" onClick={handleDeleteMedia}>
                Remove from your list
            </Button>
        </div>
    );
};
