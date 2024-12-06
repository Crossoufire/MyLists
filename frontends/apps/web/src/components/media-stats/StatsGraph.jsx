import {ResponsiveBar} from "@nivo/bar";
import {barTheme} from "@/utils/nivoThemes";
import {Separator} from "@/components/ui/separator";


export const StatsGraph = ({ title, dataList }) => {
    return (
        <div>
            <div className="text-2xl font-bold">{title} Distribution <Separator/></div>
            <div className="flex items-center h-[380px]">
                <ResponsiveBar
                    animate={true}
                    padding={0.25}
                    data={dataList}
                    theme={barTheme}
                    indexBy={"name"}
                    labelSkipWidth={20}
                    labelSkipHeight={16}
                    isInteractive={true}
                    colorBy={"indexValue"}
                    axisBottom={{ tickRotation: -30 }}
                    margin={{ top: 20, right: 20, bottom: 60, left: 40 }}
                />
            </div>
        </div>
    );
};