import {FormButton} from "@/components/app/base/FormButton";
import {Commentary} from "@/components/media/general/Commentary";
import {LabelLists} from "@/components/media/general/LabelLists";
import {TvUserDetails} from "@/components/media/tv/TvUserDetails";
import {ManageFavorite} from "@/components/media/general/ManageFavorite";
import {HistoryDetails} from "@/components/media/general/HistoryDetails";
import {GamesUserDetails} from "@/components/media/games/GamesUserDetails";
import {BooksUserDetails} from "@/components/media/books/BooksUserDetails";
import {MoviesUserDetails} from "@/components/media/movies/MoviesUserDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";
import {userMediaMutations} from "@/api/mutations/mediaMutations";


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


export const UserListDetails = ({ apiData, mediaId, mediaType }) => {
    const MediaUserDetails = mediaComponentMap(mediaType);
    const { addToList, removeFromList, updateFavorite, updateComment } = userMediaMutations(
        mediaType, mediaId, ["details", mediaType, mediaId.toString()]
    );

    const handleAddMediaUser = () => {
        addToList.mutate({ payload: undefined });
    };

    const handleDeleteMedia = () => {
        if (!window.confirm("Do you want to remove this media from your list?")) return;
        removeFromList.mutate();
    };

    if (!apiData.user_data) {
        return (
            <div className="w-[300px]">
                <FormButton onClick={handleAddMediaUser} disabled={addToList.isPending}>
                    Add to your list
                </FormButton>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            <Tabs defaultValue="yourInfo">
                <TabsList className="w-full items-center justify-start">
                    <TabsTrigger value="yourInfo" className="w-full">Your Info</TabsTrigger>
                    <TabsTrigger value="history" className="w-full" disabled={apiData.user_data.history.length === 0}>
                        History ({apiData.user_data.history.length})
                    </TabsTrigger>
                    <div className="flex items-center justify-end w-full mr-3 text-primary text-xl">
                        <ManageFavorite
                            updateFavorite={updateFavorite}
                            isFavorite={apiData.user_data.favorite}
                        />
                    </div>
                </TabsList>
                <TabsContent value="yourInfo" className="w-[300px] p-5 pt-3 bg-card rounded-md">
                    <MediaUserDetails
                        mediaType={mediaType}
                        mediaId={apiData.media.id}
                        userData={apiData.user_data}
                        totalPages={apiData.media?.pages}
                    />
                    <Commentary
                        updateComment={updateComment}
                        content={apiData.user_data.comment}
                    />
                    <LabelLists
                        mediaType={mediaType}
                        mediaId={apiData.media.id}
                        labelsInList={apiData.user_data.labels.already_in}
                    />
                </TabsContent>
                <TabsContent value="history" className="w-[300px] p-5 pt-3 bg-card rounded-md overflow-y-hidden
                hover:overflow-y-auto max-h-[355px]">
                    <HistoryDetails
                        mediaType={mediaType}
                        mediaId={apiData.media.id}
                        history={apiData.user_data.history}
                    />
                </TabsContent>
            </Tabs>
            <FormButton variant="destructive" disabled={removeFromList.isPending} onClick={handleDeleteMedia}>
                Remove from your list
            </FormButton>
        </div>
    );
};
