import {Link} from "@tanstack/react-router";
import {capitalize} from "@/lib/utils";
import {Tooltip} from "@/components/ui/tooltip";
import {useCollapse} from "@/hooks/CollapseHook";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";


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
    const customPower = (x, p) => Math.pow(x, p);

    // Calculate the color based on the level, using a custom power scale
    const getColor = () => {
        const normalizedLevel = customPower(level / 350, 0.75);

        if (normalizedLevel <= 0.2) {
            return `hsl(150, 60%, ${70 - normalizedLevel * 50}%)`; // Pastel green to teal
        } else if (normalizedLevel <= 0.4) {
            return `hsl(${150 - (normalizedLevel - 0.2) * 375}, 60%, 60%)`; // Teal to pastel blue
        } else if (normalizedLevel <= 0.6) {
            return `hsl(75, 60%, ${60 - (normalizedLevel - 0.4) * 50}%)`; // Pastel blue to pastel yellow
        } else if (normalizedLevel <= 0.8) {
            return `hsl(${75 - (normalizedLevel - 0.6) * 375}, 60%, 55%)`; // Pastel yellow to pastel orange
        } else {
            return `hsl(0, 60%, ${55 - (normalizedLevel - 0.8) * 25}%)`; // Pastel orange to pastel red
        }
    };

    return (
        <div className="flex flex-row py-1 gap-4 items-center">
            <div className="mt-0.5 relative w-[40px] h-[34px] rounded-full flex items-center justify-center border-2"
                 style={{borderColor: getColor()}}>
                <span className="font-medium" style={{fontSize: `${Math.max(22 - level.toString().length * 2, 12)}px`}}>
                    {level}
                </span>
            </div>
            {/*<Tooltip text={rankName}>*/}
            {/*    <img*/}
            {/*        src={rankImage}*/}
            {/*        alt={rankName}*/}
            {/*        className="w-9 h-9 mt-1"*/}
            {/*    />*/}
            {/*</Tooltip>*/}
            <div className="w-full">
                <div className="flex justify-between mb-1.5">
                    <div>
                        <Link to={`/list/${mediaType}/${username}`}
                              className="hover:underline hover:underline-offset-2">
                            {capitalize(mediaType)}
                        </Link>
                    </div>
                    <div>
                        <div>{percent.toFixed(0)} %</div>
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
