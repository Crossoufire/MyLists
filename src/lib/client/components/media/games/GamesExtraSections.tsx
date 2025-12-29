import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";


type GamesDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["extraSections"]>>[number];


export const GamesExtraSections = ({ media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    const platforms = media.platforms ? media.platforms.sort((a, b) => a.name.localeCompare(b.name)) : [];

    return (
        <>
            <section>
                <h2 className="text-xl font-semibold text-primary mb-4">
                    Game Platforms
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-50 scrollbar-thin">
                    {platforms.map((plat) =>
                        <div className="flex items-center gap-3 p-2 rounded-lg bg-popover/30 border hover:bg-popover">
                            <div className="size-10 rounded bg-app-accent/20 text-primary flex items-center justify-center
                                text-sm font-bold tracking-wider shrink-0">
                                {plat.name?.[0]}{plat.name?.[1]}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-medium text-primary truncate">
                                    {plat.name}
                                </p>
                                <p className="text-xs text-muted-foreground truncate">
                                    Platform
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </section>
        </>
    );
};
