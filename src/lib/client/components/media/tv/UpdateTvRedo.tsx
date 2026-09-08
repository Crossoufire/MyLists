import {useState} from "react";
import {Pencil} from "lucide-react";
import {TvMediaType} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {TvSeasonEditor} from "@/lib/client/components/media/tv/TvSeasonEditor";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";

interface UpdateTvRedoProps {
    redo: number;
    userId: number;
    mediaId: number;
    mediaType: TvMediaType;
    onUpdateMutation: ReturnType<typeof useUpdateUserMediaMutation>;
}

export const UpdateTvRedo = ({ redo, onUpdateMutation, ...source }: UpdateTvRedoProps) => {
    const [open, setOpen] = useState(false);
    return <>
        <Button size="sm" variant="outline" className="w-34 justify-between" onClick={() => setOpen(true)}>
            {redo} Seasons <Pencil data-icon="inline-end"/>
        </Button>
        <TvSeasonEditor
            {...source}
            open={open}
            mode="redo"
            onOpenChange={setOpen}
            mutation={onUpdateMutation}
        />
    </>;
};
