import {useState} from "react";
import {UpdateType} from "@/lib/utils/enums";
import {Button} from "@/lib/client/components/ui/button";
import {Textarea} from "@/lib/client/components/ui/textarea";
import {Separator} from "@/lib/client/components/ui/separator";
import {MutedText} from "@/lib/client/components/general/MutedText";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";


interface CommentaryProps {
    content: string | null | undefined;
    updateComment: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const UpdateComment = ({ content, updateComment }: CommentaryProps) => {
    const [comment, setComment] = useState(content);
    const [isEditing, setIsEditing] = useState(false);

    const handleEditToggle = () => {
        if (!isEditing) {
            setComment(content);
        }
        setIsEditing(!isEditing);
    };

    const handleSave = () => {
        if (content === comment) return;
        updateComment.mutate({ payload: { comment: comment, type: UpdateType.COMMENT } }, {
            onSuccess: () => setIsEditing(false),
        });
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-4 font-semibold">
                Comment
                <MutedText className="text-sm mt-1">
                    <span role="button" onClick={handleEditToggle}>
                        {content ? "Edit" : "Add"}
                    </span>
                </MutedText>
            </h4>
            <Separator className="mb-1"/>
            {isEditing ?
                <>
                    <Textarea
                        value={comment ?? ""}
                        className="w-full h-20"
                        disabled={updateComment.isPending}
                        placeholder="Enter your comment..."
                        onChange={(ev) => setComment(ev.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={handleEditToggle} disabled={updateComment.isPending}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={(content === comment) || updateComment.isPending}>
                            Save
                        </Button>
                    </div>
                </>
                :
                <MutedText className="text-sm break-words max-h-[150px] overflow-y-auto">
                    {content ? `${content}` : "No comments added yet"}
                </MutedText>
            }
        </>
    );
};
