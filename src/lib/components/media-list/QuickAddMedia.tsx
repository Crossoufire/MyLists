import {CirclePlus} from "lucide-react";
import {Button} from "@/lib/components/ui/button";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {useAddMediaToListMutation} from "@/lib/react-query/query-mutations/user-media.mutations";


interface QuickAddMediaProps {
    mediaId: number;
    queryKey: string[];
    mediaType: MediaType;
    allStatuses: Status[];
}


export const QuickAddMedia = ({ mediaType, mediaId, allStatuses, queryKey }: QuickAddMediaProps) => {
    const addToListMutation = useAddMediaToListMutation(mediaType, mediaId, queryKey);

    const addMediaToUser = (status: Status) => {
        addToListMutation.mutate({ status });
    };

    return (
        <Popover>
            <PopoverTrigger>
                <CirclePlus className="w-4 h-4 opacity-70"/>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 py-1 px-1 text-sm">
                <div className="text-sm not-italic text-center mb-2 text-muted-foreground">Add to your list</div>
                {allStatuses.map((status) =>
                    <Button key={status} onClick={() => addMediaToUser(status)}>
                        {status}
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};