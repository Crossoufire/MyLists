import {LuStar} from "react-icons/lu";
import {Separator} from "@/components/ui/separator";
import {Synopsis} from "@/components/media/general/Synopsis";
import {formatDateTime, formatMinutes} from "@/utils/functions";
import {MapDetails} from "@/components/media/general/MapDetails";
import {GenericDetails} from "@/components/media/general/GenericDetails";


export const GamesDetails = ({ mediaData, mediaType }) => {
    const gameModes = mediaData.game_modes?.split(",") || [];

    return (
        <div className="flex flex-col gap-7 max-sm:mt-5">
            <div className="bg-card rounded-md p-4">
                <div className="grid lg:grid-flow-col lg:auto-cols-fr grid-cols-2">
                    <div className="flex flex-col gap-y-4">
                        <div>
                            <div className="font-semibold text-neutral-500">IGDB Rating</div>
                            <div className="flex items-center gap-1">
                                <LuStar className="text-amber-500"/> {(mediaData.vote_average / 10).toFixed(1)} ({mediaData.vote_count})
                            </div>
                        </div>
                        <MapDetails
                            job="creator"
                            name="Developers"
                            mediaType={mediaType}
                            valueList={mediaData.developers}
                        />
                        <GenericDetails
                            name="Release date"
                            value={formatDateTime(mediaData.release_date)}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="Perspective"
                            value={mediaData.player_perspective}
                        />
                        <GenericDetails
                            name="Engine"
                            value={mediaData.game_engine}
                        />
                        <MapDetails
                            name="Modes"
                            valueList={gameModes}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <MapDetails
                            name="Genres"
                            valueList={mediaData.genres}
                        />
                    </div>
                    <div className="flex flex-col gap-y-4">
                        <GenericDetails
                            name="HLTB Main"
                            value={formatMinutes(mediaData.hltb_main_time * 60, { format: "hm", onlyHours: true })}
                        />
                        <GenericDetails
                            name="HLTB Extra"
                            value={formatMinutes(mediaData.hltb_main_and_extra_time * 60, { format: "hm", onlyHours: true })}
                        />
                        <GenericDetails
                            name="HLTB Total"
                            value={formatMinutes(mediaData.hltb_total_complete_time * 60, { format: "hm", onlyHours: true })}
                        />
                    </div>
                </div>
                <Separator className="mt-3"/>
                <MapDetails
                    name="Publishers"
                    valueList={mediaData.publishers}
                    asJoin
                />
                <div className="mt-4"/>
                <MapDetails
                    name="Platforms"
                    valueList={mediaData.platforms}
                    asJoin
                />
            </div>
            <Synopsis
                synopsis={mediaData.synopsis}
            />
        </div>
    );
};