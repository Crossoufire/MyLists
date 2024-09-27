import {FormButton} from "@/components/app/base/FormButton";
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

    const handleDeleteMedia = () => {
        if (!window.confirm("Do you want to remove this media from your list?")) return;
        removeFromList.mutate();
    };

    return (
        <div className="space-y-2">
            <Tabs defaultValue="yourInfo">
                <TabsList className="w-full items-center justify-start">
                    <TabsTrigger value="yourInfo" className="w-full">Your Info</TabsTrigger>
                    <TabsTrigger value="history" className="w-full" disabled={userMedia.history.length === 0}>
                        History ({userMedia.history.length})
                    </TabsTrigger>
                    <div className="flex items-center justify-end w-full mr-3 text-primary text-xl">
                        <ManageFavorite
                            updateFavorite={updateFavorite}
                            isFavorite={userMedia.favorite}
                        />
                    </div>
                </TabsList>
                <TabsContent value="yourInfo" className="w-[300px] p-5 pt-3 bg-card rounded-md">
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
                        mediaType={mediaType}
                        mediaId={userMedia.media_id}
                        labelsInList={userMedia.labels.already_in}
                    />
                </TabsContent>
                <TabsContent value="history" className="w-[300px] p-5 pt-3 bg-card rounded-md overflow-y-hidden
                hover:overflow-y-auto max-h-[355px]">
                    <HistoryDetails
                        mediaType={mediaType}
                        history={userMedia.history}
                        mediaId={userMedia.media_id}
                    />
                </TabsContent>
            </Tabs>
            <FormButton variant="destructive" disabled={removeFromList.isPending} onClick={handleDeleteMedia}>
                Remove from your list
            </FormButton>
        </div>
    );
};
