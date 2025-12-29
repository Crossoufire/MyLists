import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {SimilarMediaCard} from "@/lib/client/components/media/base/SimilarMedia";


type MoviesDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["extraSections"]>>[number];


export const MoviesExtraSections = ({ mediaType, media }: MoviesDetailsProps<typeof MediaType.MOVIES>) => {
    return (
        <>
            <section>
                <h2 className="text-xl font-semibold text-primary mb-4">
                    Main Actors
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                    {media.actors?.map((actor) =>
                        <Link to="/details/$mediaType/$job/$name" params={{ mediaType, job: "actor", name: actor.name }}>
                            <div className="flex items-center gap-3 p-2 rounded-lg bg-popover/30 border hover:bg-popover">
                                <div className="size-10 rounded bg-app-accent/20 text-primary flex items-center justify-center
                                text-sm font-bold tracking-wider shrink-0">
                                    {actor.name?.[0]}{actor.name?.[1]}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-medium text-primary truncate hover:text-app-accent">
                                        {actor.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground truncate">
                                        Actor
                                    </p>
                                </div>
                            </div>
                        </Link>
                    )}
                </div>
            </section>
            {media.collection &&
                <section>
                    <h2 className="text-xl font-semibold mb-4 text-primary">
                        In The Same Collection
                    </h2>
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
