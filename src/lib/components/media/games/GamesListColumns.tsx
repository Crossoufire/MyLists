import {ColumnDef} from "@tanstack/react-table";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractListByType} from "@/lib/types/query.options.types";
import {DisplayPlaytime} from "@/lib/components/media/games/DisplayPlaytime";
import {ColumnConfigProps, getBaseColumns} from "@/lib/components/media/base/BaseListTable";
import {CommonInfoTableCell} from "@/lib/components/media/base/CommonInfoTableCell";


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

    base.splice(3, 0, {
        id: "information",
        header: "Information",
        cell: ({ row: { original } }) => (
            <div className="flex items-center gap-3">
                <CommonInfoTableCell
                    userMedia={original}
                />
            </div>
        ),
    });

    return base;
};
