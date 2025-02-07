import {Link} from "@tanstack/react-router";
import {useCollapse} from "@/hooks/useCollapse";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";
import {capitalize, getMediaColor, zeroPad} from "@/utils/functions";
import {MediaLevelCircle} from "@/components/app/MediaLevelCircle";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


export const MediaLevels = ({ userData }) => {
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
                {userData.settings.filter(s => s.active).map(data =>
                    <MediaLevelBar
                        level={data.level}
                        key={data.media_type}
                        mediaType={data.media_type}
                        username={userData.username}
                    />
                )}
            </CardContent>
        </Card>
    );
};


const MediaLevelBar = ({ mediaType, username, level }) => {
    const intLevel = Math.floor(level);
    const percent = (level - intLevel) * 100;

    return (
        <div className="flex flex-row py-1 gap-4 items-center">
            <MediaLevelCircle className="mt-1" intLevel={intLevel} mediaType={mediaType}/>
            <div className="w-[81%]">
                <div className="flex justify-between mb-1.5">
                    <div>
                        <Link to={`/list/${mediaType}/${username}`} className="hover:underline hover:underline-offset-2">
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
