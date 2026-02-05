import {ExternalLink, Plus} from "lucide-react";
import {capitalize} from "@/lib/utils/formating";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Card} from "@/lib/client/components/ui/card";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {isAtLeastRole, MediaType, RoleType} from "@/lib/utils/enums";
import {MediaHero} from "@/lib/client/components/media/base/MediaHero";
import {MediaSynopsis} from "@/lib/client/components/media/base/MediaSynopsis";
import {SimilarMediaCard} from "@/lib/client/components/media/base/SimilarMedia";
import {MediaComponent} from "@/lib/client/components/media/base/MediaComponent";
import {RefreshAndEdit} from "@/lib/client/components/media/base/RefreshAndEdit";
import {UserMediaDetails} from "@/lib/client/components/media/base/UserMediaDetails";
import {MediaSectionTitle} from "@/lib/client/components/media/base/MediaDetailsComps";
import {mediaDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {MediaFollowsSection} from "@/lib/client/components/media/base/MediaFollowsSection";
import {useAddMediaToListMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


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
                external={external}
                mediaType={mediaType}
            />
            <div className="grid grid-cols-12 gap-8 container mx-auto px-4 py-2 max-sm:py-0 max-lg:grid-cols-1">
                <div className="col-span-8 space-y-8 max-lg:col-span-1 max-lg:order-2">
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
                        <div className="grid grid-cols-5 gap-3 pb-4 max-sm:max-h-140 max-sm:grid-cols-2 max-sm:overflow-y-auto scrollbar-thin">
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
                <div className="col-span-4 space-y-6 max-lg:col-span-1 max-lg:order-1">
                    <div className="space-y-6 max-lg:grid max-lg:grid-cols-2 max-md:grid-cols-1 max-lg:gap-6">
                        <div className="space-y-6 max-lg:mb-0">
                            {isAtLeastRole(currentUser?.role, RoleType.MANAGER) &&
                                <RefreshAndEdit
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

                            <Button variant="outline" className="w-full gap-2" asChild>
                                <a href={media.providerData.url} target="_blank" rel="noopener noreferrer">
                                    <ExternalLink className="size-4"/>
                                    View on {media.providerData.name}
                                </a>
                            </Button>

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
                        </div>
                        <MediaFollowsSection
                            mediaType={mediaType}
                            followsData={followsData}
                        />
                    </div>
                </div>
            </div>
        </PageTitle>
    );
}
