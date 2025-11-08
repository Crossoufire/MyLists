import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/utils/enums";
import {useCollapse} from "@/lib/client/hooks/use-collapse";
import {Progress} from "@/lib/client/components/ui/progress";
import {UserSettingsType} from "@/lib/types/query.options.types";
import {MediaLevelCircle} from "@/lib/client/components/general/MediaLevelCircle";
import {capitalize, computeLevel, getMediaColor, zeroPad} from "@/lib/utils/functions";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface MediaLevelsProps {
    username: string
    settings: UserSettingsType;
}


export const MediaLevels = ({ username, settings }: MediaLevelsProps) => {
    const { caret, toggleCollapse, contentClasses } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="flex gap-2">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>List Levels</div>
                    </div>
                </CardTitle>
            </CardHeader>
            <CardContent className={contentClasses}>
                {settings.filter((s) => s.active).map((data) =>
                    <MediaLevelBar
                        username={username}
                        key={data.mediaType}
                        mediaType={data.mediaType}
                        level={computeLevel(data.timeSpent)}
                    />,
                )}
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
        <div className="flex flex-row py-1 gap-4 items-center">
            <MediaLevelCircle
                className="mt-1"
                intLevel={intLevel}
                mediaType={mediaType}
            />
            <div className="w-[81%] max-sm:w-[86%]">
                <div className="flex justify-between mb-1.5">
                    <Link
                        to="/list/$mediaType/$username"
                        params={{ mediaType, username }}
                        className="hover:underline hover:underline-offset-2"
                    >
                        {capitalize(mediaType)}
                    </Link>
                    <div>{zeroPad(percent.toFixed(0))} %</div>
                </div>
                <Progress
                    value={percent}
                    color={getMediaColor(mediaType)}
                />
            </div>
        </div>
    );
};
