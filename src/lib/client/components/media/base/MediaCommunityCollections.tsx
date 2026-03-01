import {MediaType} from "@/lib/utils/enums";
import {useSuspenseQuery} from "@tanstack/react-query";
import {CollectionCard} from "@/lib/client/components/collections/CollectionCard";
import {MediaSectionTitle} from "@/lib/client/components/media/base/MediaDetailsComps";
import {mediaCommunityCollectionsOptions} from "@/lib/client/react-query/query-options/query-options";


export const MediaCommunityCollections = ({ mediaId, mediaType }: { mediaId: number, mediaType: MediaType }) => {
    const collections = useSuspenseQuery(mediaCommunityCollectionsOptions(mediaId, mediaType)).data;

    return (
        <section>
            <MediaSectionTitle title="Popular Collections"/>
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                {collections.map((collection) =>
                    <CollectionCard
                        key={collection.id}
                        showMediaType={false}
                        collection={collection}
                    />
                )}
            </div>
        </section>
    );
};
