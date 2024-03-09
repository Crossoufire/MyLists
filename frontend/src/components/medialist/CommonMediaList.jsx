import {useParams} from "react-router-dom";
import {Switch} from "@/components/ui/switch";
import {useUser} from "@/providers/UserProvider";


export const CommonMediaList = ({ mediaData, showCommon, updateCommon }) => {
    const { currentUser } = useUser();
    const { username, mediaType } = useParams();

    if (currentUser.username === username) {
        return null;
    }

    return (
        <div className="flex gap-3 items-center flex-wrap">
            <div>{mediaData.common_ids.length}/{mediaData.total_media} common {mediaType}</div>
            <div>&#8226;</div>
            <div>Hide common</div>
            <Switch
                value={showCommon}
                onCheckedChange={updateCommon}
            />
        </div>
    );
}
