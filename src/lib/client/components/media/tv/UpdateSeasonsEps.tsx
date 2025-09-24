import {UpdateType} from "@/lib/utils/enums";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";


interface UpdateSeasonsEpsProps {
    currentSeason: number,
    currentEpisode: number,
    epsPerSeason: { season: number, episodes: number }[],
    onUpdateMutation: ReturnType<typeof useUpdateUserMediaMutation>,
}


export const UpdateSeasonsEps = ({ onUpdateMutation, epsPerSeason, currentSeason, currentEpisode }: UpdateSeasonsEpsProps) => {
    const episodes = [...Array(epsPerSeason[currentSeason - 1].episodes).keys()].map(v => (v + 1).toString());

    const handleSeasonUpdate = (season: string) => {
        onUpdateMutation.mutate({ payload: { currentSeason: parseInt(season), type: UpdateType.TV } });
    };

    const handleEpisodeUpdate = (episode: string) => {
        onUpdateMutation.mutate({ payload: { lastEpisodeWatched: parseInt(episode), type: UpdateType.TV } });
    };

    return (
        <>
            <div className="flex justify-between items-center">
                <div>Season</div>
                <Select value={currentSeason.toString()} onValueChange={handleSeasonUpdate}
                        disabled={onUpdateMutation.isPending}>
                    <SelectTrigger className="w-[130px] border-hidden px-0" size="sm">
                        <SelectValue/>
                    </SelectTrigger>
                    <SelectContent>
                        {epsPerSeason.map(item =>
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
                    <SelectTrigger className="w-[130px] border-hidden px-0" size="sm">
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

