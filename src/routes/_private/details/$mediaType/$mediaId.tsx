import {useAuth} from "@/lib/hooks/use-auth";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/components/ui/button";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Separator} from "@/lib/components/ui/separator";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {MediaType, RoleType} from "@/lib/server/utils/enums";
import AvatarCircles from "@/lib/components/ui/avatar-circles";
import {SimilarMedia} from "@/lib/components/media/base/SimilarMedia";
import {MediaFollowCard} from "@/lib/components/media/base/MediaFollowCard";
import {UserMediaDetails} from "@/lib/components/media/base/UserMediaDetails";
import {MediaDataDetails} from "@/lib/components/media/base/MediaDataDetails";
import {Tabs, TabsContent, TabsList, TabsTrigger} from "@/lib/components/ui/tabs";
import {RefreshAndEditMedia} from "@/lib/components/media/base/RefreshAndEditMedia";
import {mediaDetailsOptions, queryKeys} from "@/lib/react-query/query-options/query-options";
import {useAddMediaToListMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


export const Route = createFileRoute("/_private/details/$mediaType/$mediaId")({
    params: {
        parse: (params) => {
            return {
                mediaId: params.mediaId as string | number,
                mediaType: params.mediaType as MediaType,
            }
        }
    },
    validateSearch: (search) => ({ external: Boolean(search?.external ?? false) }),
    loaderDeps: ({ search: { external } }) => ({ external }),
    loader: async ({ context: { queryClient }, params: { mediaType, mediaId }, deps: { external } }) => {
        return queryClient.ensureQueryData(mediaDetailsOptions(mediaType, mediaId, external));
    },
    component: MediaDetailsPage,
});


function MediaDetailsPage() {
    const { currentUser } = useAuth();
    const { external } = Route.useSearch();
    const { mediaType, mediaId } = Route.useParams();
    const apiData = useSuspenseQuery(mediaDetailsOptions(mediaType, mediaId, external)).data;
    const addMediaToListMutation = useAddMediaToListMutation(mediaType, queryKeys.detailsKey(mediaType, mediaId, external));

    const handleAddMediaToUser = () => {
        addMediaToListMutation.mutate({ data: { mediaType, mediaId: apiData.media.id } });
    };

    return (
        <PageTitle title={apiData.media.name} onlyHelmet>
            <div className="max-w-[1000px] mx-auto">
                <div>
                    <h3 className="flex justify-between items-center mt-8 text-2xl font-semibold">
                        <div>{apiData.media.name}</div>
                        {(currentUser?.role === RoleType.MANAGER) &&
                            <RefreshAndEditMedia
                                external={external}
                                mediaType={mediaType}
                                mediaId={apiData.media.id}
                                apiId={apiData.media.apiId}
                                lastUpdate={apiData.media.lastApiUpdate}
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
                                src={apiData.media.imageCover}
                                className={"w-[300px] h-[450px] rounded-md"}
                            />
                            {apiData.userMedia ?
                                <UserMediaDetails
                                    mediaType={mediaType}
                                    userMedia={apiData.userMedia}
                                    queryKey={queryKeys.detailsKey(mediaType, mediaId, external)}
                                />
                                :
                                <div className="w-[300px]">
                                    <Button onClick={handleAddMediaToUser}>
                                        Add to your list
                                    </Button>
                                </div>
                            }
                        </div>
                    </div>
                    <div className="col-span-12 md:col-span-7 lg:col-span-8">
                        <Tabs defaultValue="mediaDetails">
                            <TabsList className="grid grid-cols-2">
                                <TabsTrigger value="mediaDetails">Media Details</TabsTrigger>
                                <TabsTrigger value="follows" disabled={apiData.followsData.length === 0}>
                                    <span>Your Follows &nbsp;</span>
                                    <span className="sm:hidden">
                                        ({apiData.followsData.length})
                                    </span>
                                    <AvatarCircles
                                        avatarUrls={apiData.followsData.map((follow) => follow.image)}
                                    />
                                </TabsTrigger>
                            </TabsList>
                            <TabsContent value="mediaDetails">
                                <MediaDataDetails
                                    mediaType={mediaType}
                                    mediaData={apiData.media as any}
                                />
                                <SimilarMedia
                                    mediaType={mediaType}
                                    similarMedia={apiData.similarMedia}
                                    title={`Similar ${capitalize(mediaType)}`}
                                />
                                {apiData.media?.collection && apiData.media.collection.length !== 0 &&
                                    <SimilarMedia
                                        mediaType={mediaType}
                                        title={"In The Same Collection"}
                                        similarMedia={apiData.media.collection}
                                    />
                                }
                            </TabsContent>
                            <TabsContent value="follows">
                                {apiData.followsData.length !== 0 &&
                                    <div className="mb-10 mt-6">
                                        <div className="grid grid-cols-12 gap-4">
                                            {apiData.followsData.map((followData) =>
                                                <div key={followData.id} className="col-span-12 md:col-span-6 lg:col-span-6">
                                                    <MediaFollowCard
                                                        key={followData.name}
                                                        mediaType={mediaType}
                                                        followData={followData}
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
