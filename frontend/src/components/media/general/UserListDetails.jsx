import {fetcher} from "@/api/fetcher";
import {useQuery} from "@tanstack/react-query";
import {FormButton} from "@/components/app/FormButton";
import {Commentary} from "@/components/media/general/Commentary";
import {LabelLists} from "@/components/media/general/LabelLists";
import {TvUserDetails} from "@/components/media/tv/TvUserDetails";
import {userMediaMutations} from "@/api/mutations/mediaMutations";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {HistoryDetails} from "@/components/media/general/HistoryDetails";
import {GamesUserDetails} from "@/components/media/games/GamesUserDetails";
import {BooksUserDetails} from "@/components/media/books/BooksUserDetails";
import {MoviesUserDetails} from "@/components/media/movies/MoviesUserDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {queryClient} from "@/api/queryClient";


const mediaComponentMap = (value) => {
    const components = {
        movies: MoviesUserDetails,
        series: TvUserDetails,
        anime: TvUserDetails,
        games: GamesUserDetails,
        books: BooksUserDetails,
    };
    return components[value];
};


export const UserListDetails = ({ userMedia, mediaType, queryKey }) => {
    const MediaUserDetails = mediaComponentMap(mediaType);
    const { removeFromList, updateFavorite, updateComment } = userMediaMutations(mediaType, userMedia.media_id, queryKey);
    const { data: history } = useQuery({
        queryKey: ["onOpenHistory", mediaType, userMedia.media_id],
        queryFn: () => fetcher({ url: `/history/${mediaType}/${userMedia.media_id}` }),
        staleTime: 10 * 1000,
        placeholderData: [],
    });

    const handleDeleteMedia = () => {
        if (!window.confirm("Do you want to remove this media from your list?")) return;
        removeFromList.mutate(undefined, {
            onSuccess: () => queryClient.removeQueries({ queryKey: ["onOpenHistory", mediaType, userMedia.media_id] }),
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
                        queryKey={["onOpenHistory", mediaType, userMedia.media_id]}
                    />
                </TabsContent>
            </Tabs>
            <FormButton variant="destructive" disabled={removeFromList.isPending} onClick={handleDeleteMedia}>
                Remove from your list
            </FormButton>
        </div>
    );
};
