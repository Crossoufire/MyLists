import {useMediaMutations} from "@/api";
import {CirclePlus} from "lucide-react";
import {Button} from "@/components/ui/button";
import {Popover, PopoverContent, PopoverTrigger} from "@/components/ui/popover";


export const QuickAddMedia = ({ mediaType, mediaId, allStatus, queryKey }) => {
    const { addToList } = useMediaMutations(mediaType, mediaId, queryKey);

    const addMediaToUser = (status) => {
        addToList.mutate({ payload: status });
    };

    return (
        <Popover>
            <PopoverTrigger>
                <CirclePlus className="w-4 h-4 opacity-70"/>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-40 py-1 px-1 text-sm">
                <div className="text-sm not-italic text-center mb-2 text-muted-foreground">Add to your list</div>
                {allStatus.map(status =>
                    <Button key={status} variant="list" onClick={() => addMediaToUser(status)}>
                        {status}
                    </Button>
                )}
            </PopoverContent>
        </Popover>
    );
};