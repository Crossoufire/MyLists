import {ColumnDef} from "@tanstack/react-table";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractListByType} from "@/lib/components/types";
import {DisplayEpsAndSeasons} from "@/lib/components/media/tv/DisplayEpsAndSeasons";
import {ColumnConfigProps, getBaseColumns} from "@/lib/components/media/base/BaseListTable";


export const getTvColumns = (props: ColumnConfigProps): ColumnDef<ExtractListByType<typeof MediaType.SERIES | typeof MediaType.ANIME>>[] => {
    const base = getBaseColumns<ExtractListByType<typeof MediaType.SERIES | typeof MediaType.ANIME>>(props);

    base.splice(2, 0, {
        id: "progress",
        header: "Progress",
        cell: ({ row: { original } }) => (
            <DisplayEpsAndSeasons
                //@ts-expect-error
                status={original.status}
                //@ts-expect-error
                currentSeason={original.currentSeason}
                //@ts-expect-error
                currentEpisode={original.lastEpisodeWatched}
            />
        )
    });

    return base;
};
