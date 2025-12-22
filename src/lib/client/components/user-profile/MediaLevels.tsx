import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {Progress} from "@/lib/client/components/ui/progress";
import {UserSettingsType} from "@/lib/types/query.options.types";
import {computeLevel, getMediaColor} from "@/lib/utils/functions";
import {MediaAndUserIcon} from "@/lib/client/components/media/base/MediaAndUserIcon";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface MediaLevelsProps {
    username: string
    settings: UserSettingsType;
}


export const MediaLevels = ({ username, settings }: MediaLevelsProps) => {
    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Level Breakdown
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-6">
                    {settings.filter((s) => s.active).map((data) =>
                        <MediaLevelBar
                            username={username}
                            key={data.mediaType}
                            mediaType={data.mediaType}
                            level={computeLevel(data.timeSpent)}
                        />
                    )}
                </div>
            </CardContent>
        </Card>
    );
};


interface MediaLevelBarProps {
    level: number;
    username: string;
    mediaType: MediaType;
}


const MediaLevelBar = ({ mediaType, username, level }: MediaLevelBarProps) => {
    const intLevel = Math.floor(level);
    const percent = (level - intLevel) * 100;

    return (
        <div>
            <div className="flex justify-between items-end mb-1">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <MediaAndUserIcon
                        type={mediaType}
                    />
                    <Link to="/list/$mediaType/$username" params={{ mediaType, username }}>
                            <span className="capitalize">
                                {mediaType}
                            </span>
                    </Link>
                </div>
                <span className="inline-block text-sm font-semibold tracking-wide text-app-accent">
                        <div className="inline-block text-xs text-muted-foreground text-right mt-0.5">
                            ({Math.round(percent)}%)
                        </div>
                    &nbsp; Lvl {intLevel}
                    </span>
            </div>
            <Progress
                value={percent}
                className={"h-2"}
                color={getMediaColor(mediaType)}
            />
        </div>
    );
};
