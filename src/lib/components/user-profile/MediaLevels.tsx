import {Link} from "@tanstack/react-router";
import {MediaType} from "@/lib/server/utils/enums";
import {useCollapse} from "@/lib/hooks/use-collapse";
import {Progress} from "@/lib/components/ui/progress";
import {Separator} from "@/lib/components/ui/separator";
import {MediaLevelCircle} from "@/lib/components/general/MediaLevelCircle";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {capitalize, computeLevel, getMediaColor, zeroPad} from "@/lib/utils/functions";
import {UserSettingsType} from "@/lib/types/query.options.types";


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
                    <div className="p-1 flex gap-2 items-center">
                        {caret}
                        <div role="button" onClick={toggleCollapse}>List Levels</div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent className={contentClasses}>
                {settings.filter(s => s.active).map(data =>
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
            <MediaLevelCircle className="mt-1" intLevel={intLevel} mediaType={mediaType}/>
            <div className="w-[81%]">
                <div className="flex justify-between mb-1.5">
                    <div>
                        <Link
                            //@ts-ignore
                            to={`/list/$mediaType/$username`}
                            //@ts-ignore
                            params={{ mediaType, username }}
                            className="hover:underline hover:underline-offset-2"
                        >
                            {capitalize(mediaType)}
                        </Link>
                    </div>
                    <div>{zeroPad(percent.toFixed(0))} %</div>
                </div>
                <Progress value={percent} color={getMediaColor(mediaType)}/>
            </div>
        </div>
    );
};
