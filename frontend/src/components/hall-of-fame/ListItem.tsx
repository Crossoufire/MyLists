import React from "react";
import {UserSettings} from "@/utils/types";
import {Link} from "@tanstack/react-router";
import {capitalize} from "@/utils/functions";
import {MediaLevelCircle} from "@/components/app/MediaLevelCircle";


export const ListItem = ({setting, username}: ListItemProps) => {
    return (
        <div className="flex flex-col justify-evenly items-center gap-2">
            <Link to={`/list/${setting.media_type}/${username}`} disabled={!setting.active}>
                <MediaLevelCircle
                    intLevel={setting.level}
                    isActive={setting.active}
                    className={"w-[35px] h-[35px]"}
                />
            </Link>
            <div>{capitalize(setting.media_type)}</div>
        </div>
    );
};


interface ListItemProps {
    username: string;
    setting: UserSettings;
}