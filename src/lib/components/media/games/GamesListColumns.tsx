import {ColumnDef} from "@tanstack/react-table";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractListByType} from "@/lib/components/types";
import {DisplayPlaytime} from "@/lib/components/media/games/DisplayPlaytime";
import {ColumnConfigProps, getBaseColumns} from "@/lib/components/media/base/BaseListTable";


export const getGamesColumns = (props: ColumnConfigProps): ColumnDef<ExtractListByType<typeof MediaType.GAMES>>[] => {
    const base = getBaseColumns<ExtractListByType<typeof MediaType.GAMES>>(props);

    base.splice(2, 0, {
        id: "progress",
        header: "Progress",
        cell: ({ row: { original } }) => (
            <DisplayPlaytime
                status={original.status}
                playtime={original.playtime}
            />
        )
    });

    return base;
};
