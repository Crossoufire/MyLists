import {getFeelingValues} from "@/lib/utils";
import {Tooltip} from "@/components/ui/tooltip";
import {MutedText} from "@/components/app/base/MutedText";


export const RatingDistribution = ({ ratingSystem, ratingCount, mediaType }) => {
    const maxValue = Math.max(...ratingCount);

    return (
        <div>
            <div className="font-medium text-lg">
                Rating distribution
            </div>
            {maxValue === 0 ?
                <MutedText text="No rating added yet" className="mt-2.5"/>
                :
                ratingSystem === "feeling" ?
                    <div className="flex font-semibold items-center justify-evenly mt-4">
                        {getFeelingValues().slice(1).reverse().map(feelIcon =>
                            <div key={feelIcon.value} className="space-y-2 text-center">
                                <div>{feelIcon.icon}</div>
                                <div>{ratingCount[feelIcon.value * 4]}</div>
                            </div>
                        )}
                    </div>
                    :
                    <ul className="grid grid-flow-col gap-1 items-end h-[80px] w-full pl-0">
                        {ratingCount.map((val, idx) =>
                            <Tooltip key={idx + mediaType} text={`${(idx / 2)}/10: ${val} ${mediaType}`}>
                                <li className={`w-full bg-${mediaType}`}
                                    style={{height: `calc(${(val / maxValue) * 100}% + 1px)`}}/>
                            </Tooltip>
                        )}
                    </ul>
            }
        </div>
    );
};
