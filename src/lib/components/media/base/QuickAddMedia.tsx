import {CirclePlus} from "lucide-react";
import {Button} from "@/lib/components/ui/button";
import {MediaType, Status} from "@/lib/server/utils/enums";
import {queryKeys} from "@/lib/react-query/query-options/query-options";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/components/ui/popover";
import {useAddMediaToListMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {MutedText} from "../../general/MutedText";


interface QuickAddMediaProps {
    mediaId: number;
    mediaType: MediaType;
    allStatuses: Status[];
    queryKey: ReturnType<typeof queryKeys.userListKey>;
}


export const QuickAddMedia = ({ mediaType, mediaId, allStatuses, queryKey }: QuickAddMediaProps) => {
    const addToListMutation = useAddMediaToListMutation(queryKey);

    const addMediaToUser = (status: Status) => {
        addToListMutation.mutate({ data: { mediaType, status, mediaId } });
    };

    return (
        <Popover>
            <PopoverTrigger>
                <CirclePlus className="size-4 opacity-70 mb-0.5"/>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 py-1 px-1 text-sm">
                <MutedText className="text-center mb-1" italic={false}>Add to your list</MutedText>
                {allStatuses.map((status) =>
                    <Button key={status} variant="ghost" size="sm" className="w-full justify-start" onClick={() => addMediaToUser(status)}>
                        {status}
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};