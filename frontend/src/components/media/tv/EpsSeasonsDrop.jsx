import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EpsSeasonsDrop = ({ currentSeason, currentEpisode, epsPerSeason, updateSeason, updateEpisode }) => {
    const seasons = [...Array(epsPerSeason.length).keys()].map(v => v + 1);
    const episodes = [...Array(epsPerSeason[currentSeason - 1]).keys()].map(v => v + 1);

    const handleSeasonUpdate = (season) => {
        updateSeason.mutate({ payload: parseInt(season) });
    };

    const handleEpisodeUpdate = (episode) => {
        updateEpisode.mutate({ payload: parseInt(episode) });
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
                        {seasons.map(seas => <SelectItem key={`${seas}`} value={seas}>{seas}</SelectItem>)}
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
                        {episodes.map(ep => <SelectItem key={`${ep}`} value={ep}>{ep}</SelectItem>)}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
};

