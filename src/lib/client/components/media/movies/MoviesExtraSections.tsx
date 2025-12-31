import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {SimilarMediaCard} from "@/lib/client/components/media/base/SimilarMedia";
import {MediaExtraGrid, MediaSectionTitle} from "@/lib/client/components/media/base/MediaDetailsComps";


type MoviesDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["extraSections"]>>[number];


export const MoviesExtraSections = ({ mediaType, media }: MoviesDetailsProps<typeof MediaType.MOVIES>) => {
    return (
        <>
            <section>
                <MediaSectionTitle title="Main Actors"/>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {media.actors?.map((actor) =>
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "actor", name: actor.name }}>
                            <MediaExtraGrid
                                subname="Actor"
                                clickable={true}
                                name={actor.name}
                                initials={actor.name[0] + actor.name[1]}
                            />
                        </Link>
                    )}
                </div>
            </section>
            {media.collection && media.collection.length > 0 &&
                <section>
                    <MediaSectionTitle title="In The Same Collection"/>
                    <div className="md:grid md:grid-cols-5 md:gap-y-6 md:overflow-x-hidden pb-4 flex gap-2 scrollbar-thin overflow-x-auto">
                        {media.collection?.map((item) =>
                            <SimilarMediaCard
                                item={item}
                                key={item.mediaId}
                                mediaType={mediaType}
                            />
                        )}
                    </div>
                </section>
            }
        </>
    );
};
