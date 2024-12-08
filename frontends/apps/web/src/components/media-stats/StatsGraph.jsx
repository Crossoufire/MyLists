import {ResponsiveBar} from "@nivo/bar";
import {barTheme} from "@/utils/nivoThemes";
import {getFeelingList} from "@/utils/functions";
import {Separator} from "@/components/ui/separator";
import {useRatingSystem} from "@/routes/_private/stats/$mediaType/$username.lazy";


export const StatsGraph = ({ title, dataList }) => {
    const ratingSystem = useRatingSystem().ratingSystem;
    const newDataList = (title === "Rating" && ratingSystem === "feeling") ? transformDataList(dataList) : dataList;

    function transformDataList(dataList) {
        const validValues = [0, 2, 4, 6, 8, 10];
        const validIndices = validValues.map(value => value * 2);

        const transformedList = validValues.map((value, index) => ({ name: index * 2, value: 0 }));

        dataList.forEach((item, idx) => {
            if (item.value !== 0) {
                const closestValidIndex = validIndices.reduce((prev, curr) => {
                    const prevDiff = Math.abs(idx - prev);
                    const currDiff = Math.abs(idx - curr);
                    if (currDiff < prevDiff || (currDiff === prevDiff && curr < prev)) {
                        return curr;
                    }
                    return prev;
                });

                const validIndexPosition = validIndices.indexOf(closestValidIndex);
                transformedList[validIndexPosition].value += item.value;
            }
        });

        return transformedList;
    }

    function formatBottomAxis() {
        if (title === "Rating" && ratingSystem === "score") {
            return { format: (v) => (v % 1 === 0 ? parseInt(v) : "") };
        }

        if (title === "Rating" && ratingSystem === "feeling") {
            const allIcons = getFeelingList(18);

            return {
                renderTick: ({ x, y, value }) => {
                    return (
                        <g transform={`translate(${x},${y})`}>
                            <foreignObject width="20" height="20" x="-10" y="10">
                                {allIcons.find(icon => icon.value === value).component}
                            </foreignObject>
                        </g>
                    );
                },
            };
        }

        return {};
    }

    return (
        <div>
            <div className="text-2xl font-bold">{title} Distribution <Separator/></div>
            <div className="flex items-center h-[380px]">
                <ResponsiveBar
                    animate={true}
                    padding={0.25}
                    data={newDataList}
                    theme={barTheme}
                    indexBy={"name"}
                    labelSkipWidth={20}
                    labelSkipHeight={16}
                    isInteractive={true}
                    colorBy={"indexValue"}
                    axisBottom={formatBottomAxis()}
                    margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                />
            </div>
        </div>
    );
};