import React from "react";
import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {capitalize} from "@/lib/utils/functions";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type TvDetailsProps<T extends MediaType> = Parameters<MediaConfig[T]["extraSections"]>[number];


export const TvExtraSections = ({ mediaType, media }: TvDetailsProps<typeof MediaType.SERIES | typeof MediaType.ANIME>) => {
    return (
        <>
            <section>
                <h2 className="text-xl font-semibold text-primary mb-4">
                    {capitalize(mediaType)} Actors
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
                                    <p className="text-sm font-medium text-primary truncate">
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
            <section>
                <div className="flex justify-between items-end mb-4">
                    <h2 className="text-xl font-semibold text-primary">
                        Season Breakdown
                    </h2>
                    <span className="text-sm text-muted-foreground">
                        {media.totalEpisodes} Episodes
                    </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 overflow-y-auto scrollbar-thin max-h-68">
                    {media.epsPerSeason?.map((s) =>
                        <div className="p-3 flex items-center justify-between bg-popover/30 rounded-lg border">
                            <div className="flex items-center gap-3">
                                <div className="size-9 rounded-full flex items-center justify-center text-sm
                                font-medium bg-app-accent/20">
                                    {s.season}
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-primary">
                                        Season {s.season}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {s.episodes} Episodes
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};
