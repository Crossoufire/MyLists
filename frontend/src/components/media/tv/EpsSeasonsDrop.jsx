import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EpsSeasonsDrop = ({ currentSeason, currentEpisode, epsPerSeason, updateSeason, updateEpisode }) => {
    const seasons = [...Array(epsPerSeason.length).keys()].map(v => v + 1);
    const episodes = [...Array(epsPerSeason[currentSeason - 1]).keys()].map(v => v + 1);

    const handleSeasonUpdate = async (season) => {
        await updateSeason.mutateAsync({ payload: parseInt(season) });
    };

    const handleEpisodeUpdate = async (episode) => {
        await updateEpisode.mutateAsync({ payload: parseInt(episode) });
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <div>Season</div>
                <Select value={currentSeason} onValueChange={handleSeasonUpdate}
                disabled={updateSeason.isPending || updateEpisode.isPending}>
                    <SelectTrigger className="w-[130px]" size="details">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {seasons.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-between items-center">
                <div>Episode</div>
                <Select value={currentEpisode} onValueChange={handleEpisodeUpdate}
                disabled={updateEpisode.isPending || updateSeason.isPending}>
                    <SelectTrigger className="w-[130px]" size="details">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {episodes.map(e => <SelectItem key={e} value={e}>{e}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </>
    )
};

