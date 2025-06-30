import React from "react";
import {Progress} from "@/lib/components/ui/progress";
import {MutedText} from "@/lib/components/app/MutedText";
import {Card, CardContent} from "@/lib/components/ui/card";
import {capitalize, getMediaColor} from "@/lib/utils/functions";
import {hallOfFameOptions} from "@/lib/react-query/query-options/query-options";


interface HofRankingProps {
    userRanks: Awaited<ReturnType<NonNullable<ReturnType<typeof hallOfFameOptions>["queryFn"]>>>["userRanks"];
}


export const HofRanking = ({ userRanks }: HofRankingProps) => {
    return (
        <>
            <div className="text-xl font-semibold mb-3">My Rankings</div>
            <div className="grid grid-cols-2 w-full gap-3">
                {userRanks.map((rank) => (
                    <Card key={rank.mediaType} className="p-2 max-sm:py-0 bg-card">
                        {rank.active ?
                            <CardContent className="max-sm:py-4 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="font-semibold text-lg">
                                        {capitalize(rank.mediaType)}
                                    </div>
                                    <div className="font-semibold text-xl"># {rank.rank}</div>
                                </div>
                                <Progress
                                    max={100}
                                    className="mt-2"
                                    color={getMediaColor(rank.mediaType)}
                                    value={100 - (rank.percent ? rank.percent : 100)}
                                />
                                <div className="text-xs font-semibold text-gray-400">
                                    {rank.percent ? <>Top {rank.percent.toFixed(1)}%</> : <>Top --</>}
                                </div>
                            </CardContent>
                            :
                            <CardContent className="max-sm:py-4 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="font-semibold text-lg">
                                        {capitalize(rank.mediaType)}
                                    </div>
                                </div>
                                <div className="text-sm">
                                    <MutedText>Not Activated</MutedText>
                                </div>
                            </CardContent>
                        }
                    </Card>
                ))}
            </div>
        </>
    );
};
