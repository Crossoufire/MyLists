import {Tooltip} from "@/components/ui/tooltip";
import {getFeelingValues} from "@/utils/functions.jsx";


export const RatingDistribution = ({ isFeeling, ratingCount, mediaType }) => {
    const maxValue = Math.max(...ratingCount);
    const ratingName = isFeeling ? "Feeling" : "Score";

    return (
        <div>
            <div className="font-medium text-lg">
                {ratingName} distribution
            </div>
            {maxValue === 0 ?
                <div className="text-muted-foreground mt-2.5 italic">No {ratingName.toLowerCase()} added yet</div>
                :
                isFeeling ?
                    <div className="flex font-semibold items-center justify-evenly mt-4">
                        {getFeelingValues().slice(1).reverse().map((f, idx) =>
                            <div key={idx} className="space-y-2 text-center">
                                <div>{f.icon}</div>
                                <div>{ratingCount[ratingCount.length - 1 - idx]}</div>
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
