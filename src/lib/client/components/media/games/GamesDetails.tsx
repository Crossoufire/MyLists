import {Star} from "lucide-react";
import {JobType, MediaType} from "@/lib/utils/enums";
import {Separator} from "@/lib/client/components/ui/separator";
import {Synopsis} from "@/lib/client/components/media/base/Synopsis";
import {MediaConfiguration} from "@/lib/client/components/media/media-config";
import {MapDetails} from "@/lib/client/components/media/base/MapDetails";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {GenericDetails} from "@/lib/client/components/media/base/GenericDetails";


type GamesDetailsProps<T extends MediaType> = Parameters<MediaConfiguration[T]["mediaDetails"]>[0];


export const GamesDetails = ({ mediaType, mediaData }: GamesDetailsProps<typeof MediaType.GAMES>) => {
    const gameModes = mediaData.gameModes?.split(",").map(m => ({ name: m })) || [];
    const developers = mediaData.companies ? mediaData.companies.filter(c => c.developer) : [];
    const publishers = mediaData.companies ? mediaData.companies.filter(c => c.publisher) : [];

    return (
        <>
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">IGDB Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/>
                                {mediaData.voteAverage ? (mediaData.voteAverage / 10).toFixed(1) : "-"} ({mediaData.voteCount})
                            </div>
                        </div>
                        <MapDetails
                            name="Developers"
                            job={JobType.CREATOR}
                            mediaType={mediaType}
                            dataList={developers}
                        />
                        <GenericDetails
                            name="Release date"
                            value={formatDateTime(mediaData.releaseDate, { noTime: true })}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Perspective"
                            value={mediaData.playerPerspective}
                        />
                        <GenericDetails
                            name="Engine"
                            value={mediaData.gameEngine}
                        />
                        <MapDetails
                            name="Modes"
                            dataList={gameModes}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Genres"
                            dataList={mediaData.genres}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="HLTB Main"
                            value={mediaData.hltbMainTime && formatMinutes(mediaData.hltbMainTime * 60, true)}
                        />
                        <GenericDetails
                            name="HLTB Extra"
                            value={mediaData.hltbMainAndExtraTime && formatMinutes(mediaData.hltbMainAndExtraTime * 60, true)}
                        />
                        <GenericDetails
                            name="HLTB Total"
                            value={mediaData.hltbTotalCompleteTime && formatMinutes(mediaData.hltbTotalCompleteTime * 60, true)}
                        />
                    </div>
                </div>
                <Separator className="mt-3"/>
                <MapDetails
                    asJoin={true}
                    name="Publishers"
                    dataList={publishers}
                />
                <div className="mt-4"/>
                <MapDetails
                    asJoin={true}
                    name="Platforms"
                    dataList={mediaData.platforms ?? []}
                />
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
        </>
    );
};