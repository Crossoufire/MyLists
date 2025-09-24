import React, {useState} from "react";
import {Input} from "@/lib/components/ui/input";
import {Button} from "@/lib/components/ui/button";
import {MediaType} from "@/lib/server/utils/enums";
import {useDebounce} from "@/lib/hooks/use-debounce";
import {Progress} from "@/lib/components/ui/progress";
import {PageTitle} from "@/lib/components/general/PageTitle";
import {createFileRoute, Link} from "@tanstack/react-router";
import {StatsCard} from "@/lib/components/moviedle/StatsCard";
import {useQuery, useSuspenseQuery} from "@tanstack/react-query";
import {AttemptsGraph} from "@/lib/components/moviedle/AttemptsGraph";
import {CountdownTimer} from "@/lib/components/moviedle/CountdownTimer";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {useMoviedleGuessMutation} from "@/lib/react-query/query-mutations/mediadle.mutations";
import {Award, Crown, Flame, PartyPopper, Sigma, Target, ThumbsDown, Trophy} from "lucide-react";
import {dailyMediadleOptions, mediadleSuggestionsOptions} from "@/lib/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/moviedle")({
    loader: async ({ context: { queryClient } }) => queryClient.ensureQueryData(dailyMediadleOptions()),
    component: MediadlePage,
});


function MediadlePage() {
    const [guess, setGuess] = useState("");
    const makeGuessMutation = useMoviedleGuessMutation();
    const debouncedSearch = useDebounce(guess, 350);
    const mediadleData = useSuspenseQuery(dailyMediadleOptions()).data;
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { data = [] } = useQuery(mediadleSuggestionsOptions(debouncedSearch));

    const onInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setGuess(ev.target.value);
        setShowSuggestions(true);
    };

    const onClickSuggestion = (suggestionName: string) => {
        setGuess(suggestionName);
        setShowSuggestions(false);
    };

    const onGuessClick = () => {
        makeGuessMutation.mutate({ data: { guess } }, {
            onSuccess: () => {
                setGuess("");
                setShowSuggestions(false);
            },
        });
    };

    return (
        <PageTitle title="Daily Movie Challenge" subtitle="Play the daily movie game to check your skills!">
            <div className="grid gap-6 md:grid-cols-2 mt-3">
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
                                {mediadleData.nonPixelatedCover ?
                                    <Link
                                        to="/details/$mediaType/$mediaId"
                                        params={{ mediaType: MediaType.MOVIES, mediaId: mediadleData.mediaId }}
                                        search={{ external: false }}
                                    >
                                        <img
                                            alt="Movie Cover"
                                            src={mediadleData.nonPixelatedCover}
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    </Link>
                                    :
                                    <img
                                        alt="Movie Cover"
                                        className="w-full h-full object-cover rounded-lg"
                                        src={`data:image/png;base64,${mediadleData.pixelatedCover}`}
                                    />
                                }
                            </div>

                            {mediadleData.completed ?
                                <div className="animate-fade-up rounded-lg bg-primary/10 text-center p-4 max-w-[400px] mx-auto">
                                    {mediadleData.succeeded ?
                                        <PartyPopper className="w-6 h-6 text-amber-500 mx-auto mb-1"/>
                                        :
                                        <ThumbsDown className="w-6 h-6 text-red-700 mx-auto mb-1"/>
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
                                            {showSuggestions && data.length > 0 && (
                                                <div className="absolute z-10 w-full bg-gray-800 rounded-lg mb-1 shadow-lg
                                                max-h-[150px] overflow-y-auto bottom-full">
                                                    {data.map((suggestion, idx) =>
                                                        <div
                                                            key={idx}
                                                            role="button"
                                                            className="px-4 py-2 hover:bg-gray-700"
                                                            onClick={() => onClickSuggestion(suggestion.name)}
                                                        >
                                                            {suggestion.name}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                        <Button className="w-full" onClick={onGuessClick} disabled={!guess}>
                                            Submit Guess
                                        </Button>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="flex justify-between text-sm">
                                            <span>Attempts</span>
                                            <span>{mediadleData.attempts}/{mediadleData.maxAttempts}</span>
                                        </div>
                                        <Progress value={(mediadleData.attempts / mediadleData.maxAttempts) * 100}/>
                                    </div>
                                </div>
                            }
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Your Stats</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-2 max-sm:grid-cols-2 grid-cols-3 mt-2">
                            <StatsCard
                                icon={Sigma}
                                label="Total Played"
                                color="text-blue-600"
                                value={mediadleData?.stats?.totalPlayed ?? 0}
                            />
                            <StatsCard
                                icon={Trophy}
                                label="Total Won"
                                color="text-amber-600"
                                value={mediadleData?.stats?.totalWon ?? 0}
                            />
                            <StatsCard
                                icon={Award}
                                label="Win Rate"
                                color="text-green-600"
                                value={`${mediadleData?.stats?.winRate?.toFixed(1) ?? 0.0}%`}
                            />
                            <StatsCard
                                icon={Flame}
                                color="text-red-600"
                                label="Current Streak"
                                value={mediadleData?.stats?.currentStreak ?? 0}
                            />
                            <StatsCard
                                icon={Crown}
                                label="Best Streak"
                                color="text-amber-600"
                                value={mediadleData?.stats?.bestStreak ?? 0}
                            />
                            <StatsCard
                                icon={Target}
                                label="Avg. Attempts"
                                color="text-blue-600"
                                value={mediadleData?.stats?.averageAttempts?.toFixed(2) ?? 0.0}
                            />
                        </div>
                        <div className="h-[350px]">
                            <AttemptsGraph
                                attemptsData={mediadleData?.stats?.attempts ?? []}
                                avgAttempts={mediadleData?.stats?.averageAttempts ?? 0}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </PageTitle>
    );
}
