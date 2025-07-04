import {ColumnDef} from "@tanstack/react-table";
import {MediaType} from "@/lib/server/utils/enums";
import {ExtractListByType} from "@/lib/components/types";
import {ColumnConfigProps, getBaseColumns} from "@/lib/components/media/base/BaseListTable";


export const getMoviesColumns = (props: ColumnConfigProps): ColumnDef<ExtractListByType<typeof MediaType.MOVIES>>[] => {
    return getBaseColumns(props);
};
