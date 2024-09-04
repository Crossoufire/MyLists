import {Link} from "@tanstack/react-router";
import {useCollapse} from "@/hooks/CollapseHook";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";
import {MediaLevelCircle} from "@/components/app/base/MediaLevelCircle";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";
import {capitalize, zeroPad} from "@/utils/functions";


export const MediaLevels = ({ username, mediaLevels }) => {
    const { isOpen, caret, toggleCollapse } = useCollapse();

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    <div className="p-1 flex gap-2 items-center">
                        {caret} <div role="button" onClick={toggleCollapse}>List Levels</div>
                    </div>
                </CardTitle>
                <Separator/>
            </CardHeader>
            <CardContent>
                {isOpen &&
                    <>
                        {mediaLevels.map(data =>
                            <MediaLevelBar
                                level={data.level}
                                username={username}
                                key={data.media_type}
                                mediaType={data.media_type}
                            />
                        )}
                    </>
                }
            </CardContent>
        </Card>
    );
};


const MediaLevelBar = ({ mediaType, username, level }) => {
    const intLevel = Math.floor(level);
    const percent = (level - intLevel) * 100;

    return (
        <div className="flex flex-row py-1 gap-4 items-center">
            <MediaLevelCircle intLevel={intLevel} className="mt-1"/>
            <div className="w-[81%]">
                <div className="flex justify-between mb-1.5">
                    <div>
                        <Link to={`/list/${mediaType}/${username}`} className="hover:underline hover:underline-offset-2">
                            {capitalize(mediaType)}
                        </Link>
                    </div>
                    <div>{zeroPad(percent.toFixed(0))} %</div>
                </div>
                <Progress
                    value={percent}
                    color={`bg-${mediaType}`}
                />
            </div>
        </div>
    );
};
