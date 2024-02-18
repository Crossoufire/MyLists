import {Link} from "react-router-dom";
import {zeroPad, capitalize} from "@/lib/utils";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";
import {Card, CardHeader, CardTitle, CardContent} from "@/components/ui/card";


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
                                key={data.media_type}
                                username={username}
                                mediaType={data.media_type}
                                rankName={data.rank_name}
                                rankImage={data.rank_image}
                                level={data.level}
                                percent={data.level_percent}
                            />
                        )}
                    </>
                }
            </CardContent>
        </Card>
    );
};


const MediaLevelBar = ({ mediaType, username, rankName, rankImage, level, percent }) => {
    return (
        <div className="flex flex-row py-1 gap-4 items-center">
            <Tooltip text={rankName}>
                <img
                    src={rankImage}
                    alt={rankName}
                    className="w-9 h-9 mt-1"
                />
            </Tooltip>
            <div className="w-full">
                <div className="grid grid-cols-12 mb-1.5">
                    <div className="col-span-5">
                        <Link to={`/list/${mediaType}/${username}`} className="hover:underline hover:underline-offset-2">
                            {capitalize(mediaType)}
                        </Link>
                    </div>
                    <div className="col-span-7">
                        <div>Level {zeroPad(level)}</div>
                    </div>
                </div>

                <Tooltip text={`${percent.toFixed(0)}%`}>
                    <Progress
                        value={percent.toFixed(0)}
                        color={`bg-${mediaType}`}
                    />
                </Tooltip>
            </div>
        </div>
    );
};
