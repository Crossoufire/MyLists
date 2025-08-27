import {ColumnDef} from "@tanstack/react-table";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractListByType} from "@/lib/components/types";
import {DisplayRedoValue} from "@/lib/components/media/base/DisplayRedoValue";
import {CommonInfoTableCell} from "@/lib/components/media/base/CommonInfoTableCell";
import {ColumnConfigProps, getBaseColumns} from "@/lib/components/media/base/BaseListTable";


export const getMangaColumns = (props: ColumnConfigProps): ColumnDef<ExtractListByType<typeof MediaType.MANGA>>[] => {
    const base = getBaseColumns<ExtractListByType<typeof MediaType.MANGA>>(props);

    base.splice(2, 0, {
        id: "information",
        header: "Information",
        cell: ({ row: { original } }) => {
            return (
                <div className="flex items-center gap-3">
                    <CommonInfoTableCell
                        userMedia={original}
                    />
                    {!!original.redo &&
                        <DisplayRedoValue
                            redoValue={original.redo}
                        />
                    }
                </div>
            );
        },
    });

    return base;
};
