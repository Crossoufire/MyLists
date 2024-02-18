import {Switch} from "@/components/ui/switch";


export const CommonMedia = ({ mediaType, apiData, showCommon, updateCommon }) => {
    return (
        <div className="flex gap-3 items-center flex-wrap">
            <div>{apiData.media_data.common_ids.length}/{apiData.media_data.total_media} common {mediaType}</div>
            <div>&#8226;</div>
            <div>Hide common</div>
            <Switch
                value={showCommon}
                onCheckedChange={updateCommon}
            />
        </div>
    );
}
