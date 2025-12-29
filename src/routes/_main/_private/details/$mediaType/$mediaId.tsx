import {Activity, Plus} from "lucide-react";
import {capitalize} from "@/lib/utils/functions";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Card} from "@/lib/client/components/ui/card";
import {MediaType, RoleType} from "@/lib/utils/enums";
import {Badge} from "@/lib/client/components/ui/badge";
import {useSuspenseQuery} from "@tanstack/react-query";
import {createFileRoute} from "@tanstack/react-router";
import {Button} from "@/lib/client/components/ui/button";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {MediaComponent} from "@/lib/client/components/media/base/MediaComponent";
import {SimilarMediaCard} from "@/lib/client/components/media/base/SimilarMedia";
import {MediaFollowCard} from "@/lib/client/components/media/base/MediaFollowCard";
import {UserMediaDetails} from "@/lib/client/components/media/base/UserMediaDetails";
import {mediaDetailsOptions} from "@/lib/client/react-query/query-options/query-options";
import {RefreshAndEditMedia} from "@/lib/client/components/media/base/RefreshAndEditMedia";
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

    const backdropStyle = {
        filter: "blur(20px)",
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundImage: `linear-gradient(to bottom, rgba(15, 15, 15, 0.7), rgba(15, 15, 15, 1)), url(${media.imageCover})`,
    };

    return (
        <PageTitle title={apiData.media.name} onlyHelmet>
            {/* --- HERO CONTENT --- */}
            <div className="relative left-1/2 right-1/2 -ml-[50vw] -mr-[50vw] w-screen h-[50vh] md:h-[50vh] flex items-end overflow-hidden">
                <div style={backdropStyle} className="absolute inset-0 z-0"/>
                <div className="max-w-7xl mx-auto w-full px-8 max-sm:px-2 relative z-10">
                    <div className="container mx-auto px-4 pb-12 flex flex-row items-end gap-10">
                        {/* Poster Desktop */}
                        <div className="hidden md:block w-48 lg:w-60 shrink-0 rounded-lg overflow-hidden shadow-2xl border">
                            <img
                                alt={media.name}
                                src={media.imageCover}
                                className="w-full h-full object-cover"
                            />
                        </div>

                        {/* Title & other information */}
                        <div className="flex-1 space-y-4 z-10 w-full">
                            <div className="flex flex-wrap gap-2 mb-2">
                                <MediaComponent
                                    media={media}
                                    name="overTitle"
                                    mediaType={mediaType}
                                />
                            </div>
                            <h1 className="text-4xl md:text-6xl font-bold tracking-tight text-primary drop-shadow-lg">
                                {media.name}
                            </h1>
                            <div className="flex items-center flex-wrap gap-y-2 gap-x-6 text-sm text-primary font-medium">
                                <MediaComponent
                                    media={media}
                                    name="underTitle"
                                    mediaType={mediaType}
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
                    </div>
                </div>
            </div>


            {/* --- MAIN CONTENT LAYOUT --- */}
            <div className="container mx-auto px-4 py-2 grid grid-cols-1 lg:grid-cols-12 gap-8 max-sm:py-0">
                {/* LEFT COLUMN DETAILS */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Mobile Poster */}
                    <div className="md:hidden flex justify-center items-center gap-4">
                        <div className="w-50 shrink-0 rounded-lg overflow-hidden shadow-lg border">
                            <img
                                alt={media.name}
                                src={media.imageCover}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* Info Grid */}
                    <section className="grid grid-cols-2 sm:grid-cols-4 gap-4 py-6 border-y border-app-accent/30">
                        <MediaComponent
                            media={media}
                            name="infoGrid"
                            mediaType={mediaType}
                        />
                    </section>

                    {/* Synopsis */}
                    <section>
                        <h2 className="text-xl font-semibold mb-3 text-primary">
                            Synopsis
                        </h2>
                        <p className="text-primary leading-relaxed text-base">
                            {media.synopsis}
                        </p>
                        <blockquote className="text-muted-foreground leading-relaxed text-base mt-2 italic">
                            {"tagline" in media && `— ${media.tagline}`}
                        </blockquote>
                    </section>

                    {/* Genres */}
                    <section className="flex flex-wrap gap-2 -mt-3">
                        {media.genres.map((genre) =>
                            <Badge key={genre.id} variant="black" className="text-sm px-3 py-1">
                                {genre.name}
                            </Badge>
                        )}
                    </section>

                    {/* Extra Sections */}
                    <MediaComponent
                        media={media}
                        name="extraSections"
                        mediaType={mediaType}
                    />

                    {/* Similar Media */}
                    <section>
                        <h2 className="text-xl font-semibold mb-4 text-primary">
                            Similar {capitalize(mediaType)}
                        </h2>
                        <div className="md:grid md:grid-cols-5 md:gap-y-6 md:overflow-x-hidden pb-4 flex gap-2 scrollbar-thin overflow-x-auto">
                            {similarMedia.slice(0, 10).map((item) =>
                                <SimilarMediaCard
                                    item={item}
                                    key={item.mediaId}
                                    mediaType={mediaType}
                                />
                            )}
                        </div>
                    </section>
                </div>

                {/* RIGHT COLUMN DETAILS */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Upcoming Alert */}
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

                    {/* 2. Follows Activity */}
                    <Card className="bg-popover p-0">
                        <div className="p-4 border-b">
                            <h3 className="font-semibold text-primary flex items-center gap-2">
                                <Activity className="size-5 text-app-accent"/>
                                Follows Activity ({followsData.length})
                            </h3>
                        </div>
                        <div className="p-2 mb-3 space-y-1 overflow-y-auto scrollbar-thin max-h-90">
                            {followsData.length > 0 ?
                                followsData.map((followData) =>
                                    <MediaFollowCard
                                        key={followData.name}
                                        mediaType={mediaType}
                                        followData={followData}
                                    />
                                )
                                :
                                <div className="p-4 text-center text-sm text-muted-foreground">
                                    None of your follows track this media yet.
                                </div>
                            }
                        </div>
                    </Card>
                </div>
            </div>
        </PageTitle>
    );
}
