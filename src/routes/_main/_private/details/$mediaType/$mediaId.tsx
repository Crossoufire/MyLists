import {Plus} from "lucide-react";
import {capitalize} from "@/lib/utils/functions";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Card} from "@/lib/client/components/ui/card";
import {MediaType, RoleType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MediaHero} from "@/lib/client/components/media/base/MediaHero";
import {SimilarMediaCard} from "@/lib/client/components/media/base/SimilarMedia";
import {MediaSynopsis} from "@/lib/client/components/media/base/MediaSynopsis";
import {MediaComponent} from "@/lib/client/components/media/base/MediaComponent";
import {UserMediaDetails} from "@/lib/client/components/media/base/UserMediaDetails";
import {mediaDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {RefreshAndEditMedia} from "@/lib/client/components/media/base/RefreshAndEditMedia";
import {MediaFollowsSection} from "@/lib/client/components/media/base/MediaFollowsSection";
import {useAddMediaToListMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {MediaSectionTitle} from "@/lib/client/components/media/base/MediaDetailsComps";


export const Route = createFileRoute("/_main/_private/details/$mediaType/$mediaId")({
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
    const addMediaToListMutation = useAddMediaToListMutation(mediaDetailsOptions(mediaType, mediaId, external));
    const { media, userMedia, followsData, similarMedia } = apiData;

    const handleAddMediaToUser = () => {
        addMediaToListMutation.mutate({ data: { mediaType, mediaId: apiData.media.id } });
    };

    return (
        <PageTitle title={apiData.media.name} onlyHelmet>
            <MediaHero
                media={media}
                mediaType={mediaType}
            />
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 container mx-auto px-4 py-2 max-sm:py-0">
                <div className="lg:col-span-8 space-y-8 max-sm:order-2">
                    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-app-accent/30">
                        <MediaComponent
                            media={media}
                            name="infoGrid"
                            mediaType={mediaType}
                        />
                    </section>

                    <MediaSynopsis
                        media={media}
                    />

                    <MediaComponent
                        media={media}
                        name="extraSections"
                        mediaType={mediaType}
                    />

                    <section>
                        <MediaSectionTitle
                            title={`Similar ${capitalize(mediaType)}`}
                        />
                        <div className="md:grid md:grid-cols-5 md:overflow-x-hidden gap-3 flex scrollbar-thin overflow-x-auto pb-4">
                            {similarMedia.map((item) =>
                                <SimilarMediaCard
                                    item={item}
                                    key={item.mediaId}
                                    mediaType={mediaType}
                                />
                            )}
                        </div>
                    </section>
                </div>

                <div className="lg:col-span-4 space-y-6 max-sm:order-1">
                    <div className="md:hidden flex justify-center items-center gap-4">
                        <div className="w-50 shrink-0 rounded-lg overflow-hidden shadow-lg border">
                            <img
                                alt={media.name}
                                src={media.imageCover}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {(currentUser?.role === RoleType.MANAGER) &&
                        <RefreshAndEditMedia
                            external={external}
                            mediaType={mediaType}
                            mediaId={apiData.media.id}
                            apiId={apiData.media.apiId}
                            lastUpdate={apiData.media.lastApiUpdate}
                        />
                    }

                    <MediaComponent
                        media={media}
                        name="upComingAlert"
                        mediaType={mediaType}
                    />

                    {userMedia ?
                        <UserMediaDetails
                            mediaType={mediaType}
                            userMedia={userMedia}
                            queryOption={mediaDetailsOptions(mediaType, mediaId, external)}
                        />
                        :
                        <Card>
                            <div className="text-center space-y-2">
                                <h3 className="text-lg font-semibold text-slate-200">
                                    Are you interested in this?
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                    Add this {mediaType} to your list to track your progress.
                                </p>
                            </div>
                            <Button className="w-full mt-2" onClick={handleAddMediaToUser}>
                                <Plus className="size-4"/> Add to List
                            </Button>
                        </Card>
                    }

                    <MediaFollowsSection
                        mediaType={mediaType}
                        followsData={followsData}
                    />
                </div>
            </div>
        </PageTitle>
    );
}
