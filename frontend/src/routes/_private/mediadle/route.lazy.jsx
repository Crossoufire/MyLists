import {cn} from "@/utils/functions";
import {useEffect, useState} from "react";
import {postFetcher} from "@/api/fetcher";
import {Input} from "@/components/ui/input";
import {Button} from "@/components/ui/button";
import {queryClient} from "@/api/queryClient";
import {useDebounce} from "@/hooks/DebounceHook";
import {Progress} from "@/components/ui/progress";
import {Separator} from "@/components/ui/separator";
import {PageTitle} from "@/components/app/PageTitle";
import {createLazyFileRoute, Link} from "@tanstack/react-router";
import {Card, CardContent, CardHeader, CardTitle} from "@/components/ui/card";
import {useMutation, useQuery, useSuspenseQuery} from "@tanstack/react-query";
import {dailyMediadleOptions, mediadleSuggestionsOptions} from "@/api/queryOptions";
import {LuAward, LuCrown, LuFlame, LuPartyPopper, LuSigma, LuTarget, LuThumbsDown, LuTrophy} from "react-icons/lu";


// noinspection JSCheckFunctionSignatures
export const Route = createLazyFileRoute("/_private/mediadle")({
    component: MediadlePage,
});


function MediadlePage() {
    const [guess, setGuess] = useState("");
    const [debouncedSearch] = useDebounce(guess, 350);
    const mediadleData = useSuspenseQuery(dailyMediadleOptions()).data;
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { data = [] } = useQuery(mediadleSuggestionsOptions(debouncedSearch));

    const makeGuess = useMutation({
        mutationFn: ({ guess }) => postFetcher({ url: "/daily-mediadle/guess", data: { guess } }),
        onSuccess: async () => {
            setGuess("");
            setShowSuggestions(false);
            await queryClient.invalidateQueries({ queryKey: dailyMediadleOptions().queryKey });
        }
    });

    const onInputChange = (ev) => {
        setGuess(ev.target.value);
        setShowSuggestions(true);
    };

    const onClickSuggestion = (suggestion) => {
        setGuess(suggestion);
        setShowSuggestions(false);
    };

    return (
        <PageTitle title="Daily Movie Challenge" subtitle="Play the daily movie game to check your skills!">
            <div className="grid gap-6 md:grid-cols-2 mt-5">
                <Card>
                    <CardHeader className="space-y-4 py-4">
                        <div className="flex items-center justify-center gap-2">
                            <CardTitle>Next game in</CardTitle>
                            <CountdownTimer/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="relative aspect-[2/3] max-w-[300px] mx-auto">
                                {mediadleData.non_pixelated_cover ?
                                    <Link to={`/details/movies/${mediadleData.media_id}`}>
                                        <img
                                            alt="Movie Cover"
                                            src={mediadleData.non_pixelated_cover}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </Link>
                                    :
                                    <img
                                        alt="Movie Cover"
                                        className="w-full h-full object-cover rounded-lg"
                                        src={`data:image/png;base64,${mediadleData.pixelated_cover}`}
                                    />
                                }
                            </div>

                            {mediadleData.completed ?
                                <div className="animate-fade-up rounded-lg bg-primary/10 text-center p-4 max-w-[400px] mx-auto">
                                    {mediadleData.succeeded ?
                                        <LuPartyPopper className="w-6 h-6 text-amber-500 mx-auto mb-1"/>
                                        :
                                        <LuThumbsDown className="w-6 h-6 text-red-700 mx-auto mb-1"/>
                                    }
                                    <h3 className="font-semibold">
                                        {mediadleData.succeeded ? "Congratulations!" : "Game Over :("}
                                    </h3>
                                    <p className="text-sm text-neutral-300">
                                        {mediadleData.succeeded ?
                                            `You got it in ${mediadleData.attempts} ${mediadleData.attempts === 1 ? "try" : "tries"}!`
                                            :
                                            "Better luck tomorrow ;)!"
                                        }
                                    </p>
                                </div>
                                :
                                <div className="max-w-[400px] mx-auto space-y-4">
                                    <div className="space-y-2">
                                        <div className="relative">
                                            <Input
                                                type={"text"}
                                                value={guess}
                                                onChange={onInputChange}
                                                disabled={mediadleData.completed}
                                                placeholder={"Guess the movie title..."}
                                            />
                                            {showSuggestions && data.length > 0 &&
                                                <div className="absolute z-10 w-full bg-gray-800 mt-1 rounded-md shadow-lg
                                            max-h-[150px] overflow-y-auto">
                                                    {data.map((suggestion, idx) =>
                                                        <div key={idx} role="button" className="px-4 py-2 hover:bg-gray-700"
                                                             onClick={() => onClickSuggestion(suggestion)}>
                                                            {suggestion}
                                                        </div>
                                                    )}
                                                </div>
                                            }
                                        </div>
                                        <Button className="w-full" onClick={() => makeGuess.mutate({ guess })} disabled={!guess}>
                                            Submit Guess
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Attempts</span>
                                            <span>{mediadleData.attempts}/{mediadleData.max_attempts}</span>
                                        </div>
                                        <Progress value={mediadleData.attempts / mediadleData.max_attempts * 100}/>
                                    </div>
                                </div>
                            }
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Your Stats</CardTitle>
                        <Separator/>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mt-2">
                            <StatsCard icon={LuSigma} label="Total Played" value={mediadleData?.stats?.total_played ?? 0} color="text-blue-600"/>
                            <StatsCard icon={LuAward} label="Win Rate" value={`${mediadleData?.stats?.win_rate ?? 0.0}%`} color="text-green-600"/>
                            <StatsCard icon={LuFlame} label="Current Streak" value={mediadleData?.stats?.current_streak ?? 0} color="text-red-600"/>
                            <StatsCard icon={LuCrown} label="Best Streak" value={mediadleData?.stats?.best_streak ?? 0} color="text-amber-600"/>
                            <StatsCard icon={LuTarget} label="Avg. Attempts" value={mediadleData?.stats?.average_attempts ?? 0.0} color="text-blue-600"/>
                            <StatsCard icon={LuTrophy} label="Total Won" value={mediadleData?.stats?.total_won ?? 0} color="text-amber-600"/>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageTitle>
    );
}


const StatsCard = ({ icon: Icon, label, value, color }) => {
    return (
        <div className="rounded-lg border bg-primary/10 p-3">
            <div className="flex items-center gap-2 mb-1">
                <Icon className={cn("w-5 h-5", color)}/>
                <p className="font-medium">{label}</p>
            </div>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
    );
};


const CountdownTimer = () => {
    const [timeLeft, setTimeLeft] = useState(calculateTimeLeft());

    function calculateTimeLeft() {
        const now = new Date();
        const nextMidnight = new Date();
        nextMidnight.setHours(24, 0, 0, 0);

        const difference = nextMidnight - now;

        const hours = Math.floor((difference / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((difference / 1000 / 60) % 60);
        const seconds = Math.floor((difference / 1000) % 60);

        return { hours, minutes, seconds };
    }

    useEffect(() => {
        const timer = setInterval(() => {
            setTimeLeft(calculateTimeLeft());
        }, 1000);
        return () => clearInterval(timer);
    }, []);

    return (
        <span>
            {timeLeft.hours.toString().padStart(2, "0")}:
            {timeLeft.minutes.toString().padStart(2, "0")}:
            {timeLeft.seconds.toString().padStart(2, "0")}
        </span>
    );
};
