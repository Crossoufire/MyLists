import {useEffect, useState} from "react";
import {Button} from "@/components/ui/button";
import {Textarea} from "@/components/ui/textarea";
import {Separator} from "@/components/ui/separator";
import {MutedText} from "@/components/app/base/MutedText";


export const Commentary = ({ content, updateComment }) => {
    const [updatedContent, setUpdatedContent] = useState(content);
    const [commentInput, setCommentInput] = useState(false);

    useEffect(() => {
        setUpdatedContent(content);
    }, [content]);

    const handleComment = () => {
        setCommentInput(!commentInput);
        setUpdatedContent(content);
    };

    const handleSave = async () => {
        if (content === updatedContent) return;
        await updateComment.mutateAsync({ payload: updatedContent });
        setCommentInput(false);
    };

    return (
        <>
            <h4 className="text-lg flex justify-between items-center mt-5 font-semibold">
                Comment
                <MutedText className="text-sm mt-1">
                    <span role="button" onClick={handleComment}>{content ? "Edit" : "Add"}</span>
                </MutedText>
            </h4>
            <Separator variant="large"/>
            {commentInput ?
                <>
                    <Textarea
                        value={updatedContent}
                        className="w-full h-20"
                        disabled={updateComment.isPending}
                        placeholder="Enter your comment..."
                        onChange={(ev) => setUpdatedContent(ev.target.value)}
                    />
                    <div className="flex justify-end gap-2 mt-2">
                        <Button variant="outline" size="sm" onClick={handleComment} disabled={updateComment.isPending}>
                            Cancel
                        </Button>
                        <Button size="sm" onClick={handleSave} disabled={(content === updatedContent) || updateComment.isPending}>
                            Save
                        </Button>
                    </div>
                </>
                :
                <MutedText>{updatedContent ? `${updatedContent}` : "No comments added yet"}</MutedText>
            }
        </>
    );
};
