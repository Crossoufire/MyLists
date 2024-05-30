import {useEffect, useState} from "react";
import {useLoading} from "@/hooks/LoadingHook";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EpsSeasonsDrop = ({ initSeason, initEpisode, epsPerSeason, updateSeason, updateEpisode }) => {
    const [isLoading, handleLoading] = useLoading();
    const [loadFromEps, setLoadFromEps] = useState(false);
    const [season, setSeason] = useState(initSeason || "1");
    const [episode, setEpisode] = useState(initEpisode || "1");
    const seasons = [...Array(epsPerSeason.length).keys()].map(v => v + 1);
    const episodes = [...Array(epsPerSeason[season-1]).keys()].map(v => v + 1);

    useEffect(() => {
        setSeason(initSeason);
        setEpisode(initEpisode);
    }, [initSeason, initEpisode]);

    const handleSeason = async (seas) => {
        const newVal = parseInt(seas);
        const response = await handleLoading(updateSeason, newVal);
        if (response) {
            setSeason(newVal);
            setEpisode(1);
        }
    };

    const handleEpisode = async (eps) => {
        const newVal = parseInt(eps);
        setLoadFromEps(true);
        const response = await handleLoading(updateEpisode, newVal);
        if (response) {
            setEpisode(newVal);
        }
        setLoadFromEps(false);
    };


    return (
        <>
            <div className="flex justify-between items-center">
                <div>Season</div>
                <Select value={season} onValueChange={handleSeason} disabled={isLoading}>
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
                <Select value={episode} onValueChange={handleEpisode} disabled={isLoading}>
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

