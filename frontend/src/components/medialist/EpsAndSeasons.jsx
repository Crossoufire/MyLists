import {zeroPad} from "@/utils/functions.jsx";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EpsAndSeasons = ({ isCurrent, currentSeason, currentEpisode, epsPerSeason, updateSeason, updateEps }) => {
    const seasons = [...Array(epsPerSeason.length).keys()].map(v => v + 1);
    const episodes = [...Array(epsPerSeason[currentSeason - 1]).keys()].map(v => v + 1);

    const handleSeason = (season) => {
        updateSeason.mutate({ payload: parseInt(season) });
    };

    const handleEpisode = (episode) => {
        updateEps.mutate({ payload: parseInt(episode) });
    };

    return (
        <>
            {isCurrent ?
                <div className="flex justify-center items-center h-[28px]">
                    <Select value={currentSeason} onValueChange={handleSeason}
                            disabled={updateSeason.isPending || updateEps.isPending}>
                        <SelectTrigger variant="noIcon" size="list">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {seasons.map(s => <SelectItem key={s.toString()} value={s}>S{zeroPad(s)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    &nbsp;<> |</>
                    &nbsp;
                    <Select value={currentEpisode} onValueChange={handleEpisode}
                            disabled={updateSeason.isPending || updateEps.isPending}>
                        <SelectTrigger size="list" variant="noIcon">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {episodes.map(e => <SelectItem key={e.toString()} value={e}>E{zeroPad(e)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                </div>
                :
                <div className="flex justify-center items-center h-[28px]">
                    <div>S{zeroPad(currentSeason)}</div>
                    &nbsp;<> |</>
                    &nbsp;
                    <div>E{zeroPad(currentEpisode)}</div>
                </div>
            }
        </>
    );
};
