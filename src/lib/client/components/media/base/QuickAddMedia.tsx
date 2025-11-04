import {CirclePlus} from "lucide-react";
import {MediaType, Status} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {mediaListOptions} from "@/lib/client/react-query/query-options/query-options";
import {Popover, PopoverContent, PopoverTrigger} from "@/lib/client/components/ui/popover";
import {useAddMediaToListMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface QuickAddMediaProps {
    mediaId: number;
    mediaType: MediaType;
    allStatuses: Status[];
    queryOption: ReturnType<typeof mediaListOptions>;
}


export const QuickAddMedia = ({ mediaType, mediaId, allStatuses, queryOption }: QuickAddMediaProps) => {
    const addToListMutation = useAddMediaToListMutation(queryOption);

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