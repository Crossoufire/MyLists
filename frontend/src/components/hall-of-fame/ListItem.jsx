import {Link} from "@tanstack/react-router";
import {capitalize} from "@/utils/functions";
import {MediaLevelCircle} from "@/components/app/MediaLevelCircle";


export const ListItem = ({ setting, username }) => {
    return (
        <div className="flex flex-col justify-evenly items-center gap-2">
            <Link to={`/list/${setting.media_type}/${username}`} disabled={!setting.active}>
                <MediaLevelCircle
                    isActive={setting.active}
                    className={"w-[35px] h-[35px]"}
                    intLevel={parseInt(setting.level)}
                />
            </Link>
            <div>{capitalize(setting.media_type)}</div>
        </div>
    );
};