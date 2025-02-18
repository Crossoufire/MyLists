import {toast} from "sonner";
import {useQuery} from "@tanstack/react-query";
import {FormButton} from "@/components/app/FormButton";
import {historyOptions, queryClient, queryKeys} from "@/api";
import {Commentary} from "@/components/media-user/Commentary";
import {LabelLists} from "@/components/media-user/LabelLists";
import {TvUserDetails} from "@/components/media-user/TvUserDetails";
import {ManageFavorite} from "@/components/media-user/ManageFavorite";
import {HistoryDetails} from "@/components/media-user/HistoryDetails";
import {GamesUserDetails} from "@/components/media-user/GamesUserDetails";
import {BooksUserDetails} from "@/components/media-user/BooksUserDetails";
import {MangaUserDetails} from "@/components/media-user/MangaUserDetails";
import {MoviesUserDetails} from "@/components/media-user/MoviesUserDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {useRemoveMediaFromListMutation, useUserMediaMutations} from "@/api/mutations";


const mediaComponentMap = (value) => {
    const components = {
        movies: MoviesUserDetails,
        series: TvUserDetails,
        anime: TvUserDetails,
        games: GamesUserDetails,
        books: BooksUserDetails,
        manga: MangaUserDetails,
    };
    return components[value];
};


export const UserMediaDetails = ({ userMedia, mediaType, queryKey }) => {
    const MediaUserDetails = mediaComponentMap(mediaType);
    const { data: history } = useQuery(historyOptions(mediaType, userMedia.media_id));
    const removeFromList = useRemoveMediaFromListMutation(mediaType, userMedia.media_id, queryKey);
    const { updateFavorite, updateComment } = useUserMediaMutations(mediaType, userMedia.media_id, queryKey);

    const handleDeleteMedia = () => {
        if (!window.confirm("Do you want to remove this media from your list?")) return;
        removeFromList.mutate(undefined, {
            onSuccess: () => {
                toast.success("Media removed from your list");
                queryClient.removeQueries({ queryKey: queryKeys.historyKey(mediaType, userMedia.media_id) });
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
                        <TabsTrigger value="history" disabled={history.length === 0}>
                            History ({history.length})
                        </TabsTrigger>
                    </div>
                    <ManageFavorite
                        updateFavorite={updateFavorite}
                        isFavorite={userMedia.favorite}
                    />
                </TabsList>
                <TabsContent value="yourInfo">
                    <div className="p-5 pt-3 bg-card rounded-md">
                        <MediaUserDetails
                            queryKey={queryKey}
                            userMedia={userMedia}
                            mediaType={mediaType}
                        />
                        <Commentary
                            content={userMedia.comment}
                            updateComment={updateComment}
                        />
                        <LabelLists
                            queryKey={queryKey}
                            mediaType={mediaType}
                            mediaId={userMedia.media_id}
                            mediaLabels={userMedia.labels ?? []}
                        />
                    </div>
                </TabsContent>
                <TabsContent value="history" className="bg-card rounded-md overflow-y-auto max-h-[353px] p-5 pt-3">
                    <HistoryDetails
                        history={history}
                        queryKey={queryKeys.historyKey(mediaType, userMedia.media_id)}
                    />
                </TabsContent>
            </Tabs>
            <FormButton variant="destructive" disabled={removeFromList.isPending} onClick={handleDeleteMedia}>
                Remove from your list
            </FormButton>
        </div>
    );
};
