import {userClient} from "@/api/MyApiClient";
import {Switch} from "@/components/ui/switch";
import {useParams} from "@tanstack/react-router";


export const CommonMediaList = ({ mediaData, showCommon, updateCommon }) => {
    const currentUser = userClient.currentUser;
    const { username, mediaType } = useParams({ strict: false });

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
