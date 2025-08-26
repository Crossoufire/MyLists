import {ColumnDef} from "@tanstack/react-table";
import {statusUtils} from "@/lib/utils/functions";
import {CircleCheck, Settings2} from "lucide-react";
import {UserMediaItem} from "@/lib/components/types";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {BlockLink} from "@/lib/components/general/BlockLink";
import {QuickAddMedia} from "@/lib/components/media/base/QuickAddMedia";
import {queryKeys} from "@/lib/react-query/query-options/query-options";


export interface ColumnConfigProps {
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
    onEdit: (mediaId: number) => void;
    queryKey: ReturnType<typeof queryKeys.userListKey>;
}


export const getBaseColumns = <T extends UserMediaItem>({ isCurrent, isConnected, mediaType, queryKey, onEdit }: ColumnConfigProps): ColumnDef<T>[] => [
    {
        id: "name",
        header: "Name",
        cell: ({ row: { original } }) => (
            <BlockLink to="/details/$mediaType/$mediaId" params={{ mediaType, mediaId: original.mediaId }}>
                <div className="flex items-center gap-3">
                    {original.mediaName}
                    {!isCurrent && original.common && <CircleCheck className="h-4 w-4 text-green-500"/>}
                </div>
            </BlockLink>
        ),
    },
    {
        accessorKey: "status",
        header: "Status",
    },
    {
        id: "actions",
        cell: ({ row: { original } }) => {
            if (!isConnected) return null;
            if (isCurrent) {
                return (
                    <div role="button" className="flex items-center justify-center" onClick={() => onEdit(original.mediaId)}>
                        <Settings2 className="w-4 h-4 opacity-70"/>
                    </div>
                );
            }
            if (!original.common) {
                return (
                    <div className="flex items-center justify-center">
                        <QuickAddMedia
                            queryKey={queryKey}
                            mediaType={mediaType}
                            mediaId={original.mediaId}
                            allStatuses={statusUtils.byMediaType(mediaType)}
                        />
                    </div>
                );
            }
            return null;
        },
    },
];
