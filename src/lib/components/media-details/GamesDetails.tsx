import {Star} from "lucide-react";
import {MediaType} from "@/lib/server/utils/enums";
import {Separator} from "@/lib/components/ui/separator";
import {Synopsis} from "@/lib/components/media-details/Synopsis";
import {formatDateTime, formatMinutes} from "@/lib/utils/functions";
import {MapDetails} from "@/lib/components/media-details/MapDetails";
import {GenericDetails} from "@/lib/components/media-details/GenericDetails";


interface GamesDetailsProps {
    mediaData: any;
    mediaType: MediaType;
}


export const GamesDetails = ({ mediaData, mediaType }: GamesDetailsProps) => {
    const gameModes = mediaData.gameModes?.split(",") || [];

    console.log(mediaData);

    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">IGDB Rating</div>
                            <div className="flex items-center gap-1">
                                <Star className="w-4 h-4 text-amber-500"/> {(mediaData.voteAverage ?? 0 / 10).toFixed(1)} ({mediaData.voteCount})
                            </div>
                        </div>
                        <MapDetails
                            job="creator"
                            name="Developers"
                            mediaType={mediaType}
                            valueList={mediaData.gamesCompanies.filter((company: any) => company.developer).map((company: any) => company.name)}
                        />
                        <GenericDetails
                            name="Release date"
                            value={formatDateTime(mediaData.releaseDate)}
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
                            valueList={gameModes}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Genres"
                            valueList={mediaData.gamesGenres.map((genre: any) => genre.name)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="HLTB Main"
                            value={formatMinutes(mediaData.hltbMainTime * 60, true)}
                        />
                        <GenericDetails
                            name="HLTB Extra"
                            value={formatMinutes(mediaData.hltbMainAndExtraTime * 60, true)}
                        />
                        <GenericDetails
                            name="HLTB Total"
                            value={formatMinutes(mediaData.hltbTotalCompleteTime * 60, true)}
                        />
                    </div>
                </div>
                <Separator className="mt-3"/>
                <MapDetails
                    asJoin={true}
                    name="Publishers"
                    valueList={mediaData.gamesCompanies.filter((company: any) => company.publisher).map((company: any) => company.name)}
                />
                <div className="mt-4"/>
                <MapDetails
                    asJoin={true}
                    name="Platforms"
                    valueList={mediaData.gamesPlatforms.map((pt: any) => pt.name)}
                />
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
        </div>
    );
};