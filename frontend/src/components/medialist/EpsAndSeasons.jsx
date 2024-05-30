import {zeroPad} from "@/lib/utils";
import {useEffect, useState} from "react";
import {useLoading} from "@/hooks/LoadingHook";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/components/ui/select";


export const EpsAndSeasons = ({ isCurrent, status, initSeas, initEps, epsPerSeason, updateSeas, updateEps }) => {
    const [isLoading, handleLoading] = useLoading();
    const [currentEps, setCurrentEps] = useState(initEps || 1);
    const seasons = [...Array(epsPerSeason.length).keys()].map(v => v + 1);
    const [currentSeas, setCurrentSeas] = useState(initSeas || 1);
    const episodes = [...Array(epsPerSeason[currentSeas - 1]).keys()].map(v => v + 1);

    useEffect(() => {
        if (status === "Completed") {
            setCurrentSeas(epsPerSeason.length);
            setCurrentEps(epsPerSeason[epsPerSeason.length - 1]);
        }
    }, [status]);

    const handleSeason = async (value) => {
        const newVal = parseInt(value);
        const response = await handleLoading(updateSeas, newVal);
        if (response) {
            setCurrentSeas(newVal);
            setCurrentEps(1);
        }
    };

    const handleEpisode = async (value) => {
        const newVal = parseInt(value);
        const response = await handleLoading(updateEps, newVal);
        if (response) {
            setCurrentEps(newVal);
        }
    };

    return (
        <>
            {isCurrent ?
                <div className="flex justify-center items-center h-[28px]">
                    <Select value={currentSeas} onValueChange={handleSeason} disabled={isLoading}>
                        <SelectTrigger variant="noIcon" size="list">
                            <SelectValue/>
                        </SelectTrigger>
                        <SelectContent>
                            {seasons.map(s => <SelectItem key={s.toString()} value={s}>S{zeroPad(s)}</SelectItem>)}
                        </SelectContent>
                    </Select>
                    &nbsp;<> | </>&nbsp;
                    <Select value={currentEps} onValueChange={handleEpisode}
                            disabled={isLoading}>
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
                    <div>S{zeroPad(currentSeas)}</div>
                    &nbsp;<> | </>&nbsp;
                    <div>E{zeroPad(currentEps)}</div>
                </div>
            }
        </>
    )
};
