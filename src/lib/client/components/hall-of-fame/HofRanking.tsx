import React from "react";
import {Ban} from "lucide-react";
import {capitalize} from "@/lib/utils/formating";
import {getMediaColor} from "@/lib/utils/functions";
import {HofUserRank} from "@/lib/types/query.options.types";
import {Progress} from "@/lib/client/components/ui/progress";
import {Card, CardContent} from "@/lib/client/components/ui/card";


interface HofRankingProps {
    userRanks: HofUserRank;
}


export const HofRanking = ({ userRanks }: HofRankingProps) => {
    return (
        <>
            <div className="text-xl font-semibold mb-3">
                My Rankings
            </div>
            <div className="grid grid-cols-2 w-full gap-3">
                {userRanks.map((rank) =>
                    <Card key={rank.mediaType} className="p-2 max-sm:py-0 bg-card">
                        {rank.active ?
                            <CardContent className="max-sm:py-4 p-2 space-y-1">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="font-semibold text-lg">
                                        {capitalize(rank.mediaType)}
                                    </div>
                                    <div className="font-semibold text-xl">
                                        # {rank.rank}
                                    </div>
                                </div>
                                <Progress
                                    max={100}
                                    className="mt-2"
                                    color={getMediaColor(rank.mediaType)}
                                    value={100 - (rank.percent ? rank.percent : 100)}
                                />
                                <div className="text-xs font-semibold text-app-accent">
                                    {rank.percent ? <>Top {rank.percent.toFixed(1)}%</> : <>Top - %</>}
                                </div>
                            </CardContent>
                            :
                            <CardContent className="max-sm:py-4 p-2 space-y-2">
                                <div className="flex items-center justify-between gap-4">
                                    <div className="font-semibold text-lg">
                                        {capitalize(rank.mediaType)}
                                    </div>
                                </div>
                                <div className="flex gap-1 items-center text-xs text-muted-foreground">
                                    <Ban size={14}/> Not Activated
                                </div>
                            </CardContent>
                        }
                    </Card>
                )}
            </div>
        </>
    );
};
