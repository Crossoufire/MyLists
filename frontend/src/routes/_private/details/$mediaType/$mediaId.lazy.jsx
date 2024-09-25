import {useAuth} from "@/hooks/AuthHook";
import {detailsOptions} from "@/api/queryOptions";
import {Separator} from "@/components/ui/separator";
import {useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/components/app/base/PageTitle";
import {createLazyFileRoute} from "@tanstack/react-router";
import {FollowCard} from "@/components/media/general/FollowCard";
import {SimilarMedia} from "@/components/media/general/SimilarMedia";
import {RefreshAndEditMedia} from "@/components/media/general/RefreshAndEditMedia";
import {UserListDetails} from "@/components/media/general/UserListDetails";
import {MediaDataDetails} from "@/components/media/general/MediaDataDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/components/ui/tabs";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/details/$mediaType/$mediaId")({
    component: MediaDetailsPage,
});


function MediaDetailsPage() {
    const { currentUser } = useAuth();
    const { external } = Route.useSearch();
    const { mediaType, mediaId } = Route.useParams();
    const apiData = useSuspenseQuery(detailsOptions(mediaType, mediaId, external)).data;

    return (
        <PageTitle title={apiData.media.name} onlyHelmet>
            <div className="max-w-[1000px] mx-auto">
                <div>
                    <h3 className="flex justify-between items-center mt-8 text-2xl font-semibold">
                        <div>{apiData.media.name}</div>
                        {currentUser.role === "manager" &&
                            <RefreshAndEditMedia
                                mediaType={mediaType}
                                mediaId={apiData.media.id}
                                lastUpdate={apiData.media.last_api_update}
                            />
                        }
                    </h3>
                    <Separator/>
                </div>
                <div className="grid grid-cols-12 gap-y-10">
                    <div className="col-span-12 md:col-span-5 lg:col-span-4">
                        <div className="flex flex-col items-center sm:items-start gap-4">
                            <img
                                alt="media-cover"
                                src={apiData.media.media_cover}
                                className="w-[300px] h-[450px] rounded-md"
                            />
                            <UserListDetails
                                apiData={apiData}
                                mediaType={mediaType}
                                mediaId={apiData.media.id}
                            />
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-7 lg:col-span-8">
                        <Tabs defaultValue="mediaDetails">
                            <TabsList className="grid grid-cols-2">
                                <TabsTrigger value="mediaDetails">Media Details</TabsTrigger>
                                <TabsTrigger value="follows" disabled={apiData.follows_data.length === 0}>
                                    Your Follows ({apiData.follows_data.length})
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="mediaDetails">
                                <MediaDataDetails
                                    mediaType={mediaType}
                                    mediaData={apiData.media}
                                />
                                <SimilarMedia
                                    mediaType={mediaType}
                                    similarMedia={apiData.similar_media}
                                />
                            </TabsContent>
                            <TabsContent value="follows">
                                {apiData.follows_data.length !== 0 &&
                                    <div className="mb-10 mt-6">
                                        <div className="grid grid-cols-12 gap-4">
                                            {apiData.follows_data.map(follow =>
                                                <div key={follow.id}
                                                     className="col-span-12 md:col-span-6 lg:col-span-6">
                                                    <FollowCard
                                                        follow={follow}
                                                        key={follow.username}
                                                        mediaType={mediaType}
                                                    />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                }
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>
        </PageTitle>
    );
}
