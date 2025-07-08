import {ColumnDef} from "@tanstack/react-table";
import {UserMediaItem} from "@/lib/components/types";
import {CircleCheck, Settings2} from "lucide-react";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {BlockLink} from "@/lib/components/general/BlockLink";
import {QuickAddMedia} from "@/lib/components/media/base/QuickAddMedia";
import {StatusUtils} from "@/lib/utils/functions";


export interface ColumnConfigProps {
    queryKey: string[];
    isCurrent: boolean;
    isConnected: boolean;
    mediaType: MediaType;
    onEdit: (mediaId: number) => void;
}


export const getBaseColumns = <T extends UserMediaItem>({ isCurrent, isConnected, mediaType, queryKey, onEdit }: ColumnConfigProps): ColumnDef<T>[] => [
    {
        id: "name",
        header: "Name",
        cell: ({ row: { original } }) => (
            <BlockLink to={`/details/${mediaType}/${original.mediaId}`}>
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
                            allStatuses={StatusUtils.byMediaType(mediaType)}
                        />
                    </div>
                );
            }
            return null;
        },
    },
];
