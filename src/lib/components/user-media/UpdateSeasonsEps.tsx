import {useUpdateUserMediaMutation} from "@/lib/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/components/ui/select";


interface UpdateSeasonsEpsProps {
    currentSeason: number,
    currentEpisode: number,
    epsPerSeason: { season: number, episodes: number }[] | string,
    onUpdateMutation: ReturnType<typeof useUpdateUserMediaMutation>,
}


export const UpdateSeasonsEps = ({ onUpdateMutation, epsPerSeason, currentSeason, currentEpisode }: UpdateSeasonsEpsProps) => {
    let epsPerSeasonData = epsPerSeason;
    if (typeof epsPerSeason === "string") {
        epsPerSeasonData = JSON.parse(epsPerSeason) as { season: number, episodes: number }[];
    }
    else {
        epsPerSeasonData = epsPerSeason;
    }

    const episodes = [...Array(epsPerSeasonData[currentSeason - 1].episodes).keys()].map(v => (v + 1).toString());

    const handleSeasonUpdate = (season: string) => {
        onUpdateMutation.mutate({ payload: { currentSeason: parseInt(season) } });
    };

    const handleEpisodeUpdate = (episode: string) => {
        onUpdateMutation.mutate({ payload: { lastEpisodeWatched: parseInt(episode) } });
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <div>Season</div>
                <Select value={currentSeason.toString()} onValueChange={handleSeasonUpdate}
                        disabled={onUpdateMutation.isPending}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {epsPerSeasonData.map(item =>
                            <SelectItem key={item.season} value={item.season.toString()}>
                                {item.season}
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
            <div className="flex justify-between items-center">
                <div>Episode</div>
                <Select value={currentEpisode.toString()} onValueChange={handleEpisodeUpdate}
                        disabled={onUpdateMutation.isPending}>
                    <SelectTrigger className="w-[130px]">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {episodes.map(episode =>
                            <SelectItem key={episode} value={episode}>
                                {episode}
                            </SelectItem>
                        )}
                    </SelectContent>
                </Select>
            </div>
        </>
    );
};

