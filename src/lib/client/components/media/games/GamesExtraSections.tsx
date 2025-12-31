import React from "react";
import {MediaType} from "@/lib/utils/enums";
import {MediaConfig} from "@/lib/client/components/media/media-config";
import {MediaExtraGrid, MediaSectionTitle} from "@/lib/client/components/media/base/MediaDetailsComps";


type GamesDetailsProps<T extends MediaType> = Parameters<NonNullable<MediaConfig[T]["extraSections"]>>[number];


export const GamesExtraSections = ({ media }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    const platforms = media.platforms ? media.platforms.sort((a, b) => a.name.localeCompare(b.name)) : [];

    return (
        <>
            {platforms &&
                <section>
                    <MediaSectionTitle title="Game Platforms"/>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 overflow-y-auto max-h-50 scrollbar-thin">
                        {platforms.map((plat) =>
                            <MediaExtraGrid
                                name={plat.name}
                                subname="Platform"
                                initials={plat.name?.[0] + plat.name?.[1]}
                            />
                        )}
                    </div>
                </section>
            }
        </>
    );
};
