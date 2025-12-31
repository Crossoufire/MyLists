import React, {useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {useDebounce} from "@/lib/client/hooks/use-debounce";
import {createFileRoute, Link} from "@tanstack/react-router";
import {useQuery, useSuspenseQuery} from "@tanstack/react-query";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {EmptyState} from "@/lib/client/components/user-profile/EmptyState";
import {Loader2, PartyPopper, Search, SearchX, ThumbsDown} from "lucide-react";
import {CountdownTimer} from "@/lib/client/components/moviedle/CountdownTimer";
import {SimpleStatCard} from "@/lib/client/components/user-profile/SimpleStatCard";
import {Card, CardContent, CardHeader, CardTitle} from "@/lib/client/components/ui/card";
import {useMoviedleGuessMutation} from "@/lib/client/react-query/query-mutations/mediadle.mutations";
import {dailyMediadleOptions, mediadleSuggestionsOptions} from "@/lib/client/react-query/query-options/query-options";


export const Route = createFileRoute("/_main/_private/moviedle")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(dailyMediadleOptions);
    },
    component: MediadlePage,
});


function MediadlePage() {
    const [guess, setGuess] = useState("");
    const makeGuessMutation = useMoviedleGuessMutation();
    const debouncedSearch = useDebounce(guess, 350);
    const mediadleData = useSuspenseQuery(dailyMediadleOptions).data;
    const [showSuggestions, setShowSuggestions] = useState(false);
    const { data = [], isFetching } = useQuery(mediadleSuggestionsOptions(debouncedSearch));

    const attemptsData = mediadleData.stats?.attempts ?? [];

    const frequencyMap = attemptsData.reduce<Record<number, number>>((acc, curr) => {
        acc[curr.attempts] = (acc[curr.attempts] || 0) + 1;
        return acc;
    }, {});

    const frequencies = Object.values(frequencyMap);
    const maxFreq = frequencies.length > 0 ? Math.max(...frequencies) : 0;

    const onInputChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
        setGuess(ev.target.value);
        setShowSuggestions(true);
    };

    const onClickSuggestion = (suggestionName: string) => {
        setGuess(suggestionName);
        setShowSuggestions(false);
    };

    const handleMutation = (guessValue: string) => {
        makeGuessMutation.mutate({ data: { guess: guessValue } }, {
            onSuccess: () => {
                setGuess("");
                setShowSuggestions(false);
            },
        });
    };

    const onGuessClick = () => {
        if (!guess) return;
        handleMutation(guess);
    };

    const onSkipClick = () => {
        handleMutation("rtehsqqt");
    };

    return (
        <PageTitle title="Daily Movie Challenge" subtitle="Play the daily movie game to check your skills!">
            <div className="grid gap-6 md:grid-cols-2 mt-6">
                <Card>
                    <CardHeader className="space-y-4 pb-4">
                        <div className="flex items-center justify-center gap-2">
                            <CardTitle>Next game in</CardTitle>
                            <CountdownTimer/>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="relative aspect-2/3 max-w-75 mx-auto">
                                {mediadleData.nonPixelatedCover ?
                                    <Link
                                        search={{ external: false }}
                                        to="/details/$mediaType/$mediaId"
                                        params={{
                                            mediaType: MediaType.MOVIES,
                                            mediaId: mediadleData.mediaId,
                                        }}
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
                                <div className="animate-fade-up rounded-lg bg-popover text-center p-4 max-w-100 mx-auto mb-8">
                                    {mediadleData.succeeded ?
                                        <PartyPopper className="size-6 text-app-rating mx-auto mb-1"/>
                                        :
                                        <ThumbsDown className="size-6 text-destructive mx-auto mb-1"/>
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
                                <div className="max-w-100 mx-auto mb-8">
                                    <div className="space-y-4">
                                        <div className="space-y-1">
                                            <div className="flex justify-between text-xs font-medium uppercase text-muted-foreground">
                                                <span>Attempts</span>
                                                <span>{mediadleData.attempts} / {mediadleData.maxAttempts}</span>
                                            </div>
                                            <div className="flex gap-1.5 h-2">
                                                {Array.from({ length: mediadleData.maxAttempts }).map((_, idx) => {
                                                    const isUsed = idx < mediadleData.attempts;
                                                    return (
                                                        <div
                                                            key={idx}
                                                            className={`flex-1 rounded-sm transition-colors duration-300 
                                                            ${isUsed ? "bg-destructive" : "bg-neutral-700"}`}
                                                        />
                                                    );
                                                })}
                                            </div>
                                        </div>
                                        <div className="relative flex items-center bg-background border rounded-lg transition-all
                                        duration-200 focus-within:ring-2 focus-within:ring-app-accent/50
                                        focus-within:border-app-accent">
                                            <Input
                                                type="text"
                                                value={guess}
                                                onChange={onInputChange}
                                                placeholder="Search a movie..."
                                                disabled={mediadleData.completed}
                                                className="flex-1 text-sm border-none focus:outline-none focus:ring-0
                                                    focus:border-none focus-visible:border-none focus-visible:ring-0"
                                            />
                                            <div className="px-3 text-muted-foreground">
                                                {(isFetching && guess.trim().length >= 2) ?
                                                    <Loader2 className="size-4 animate-spin text-app-accent"/>
                                                    :
                                                    <Search className="size-4"/>
                                                }
                                            </div>
                                            {(showSuggestions && debouncedSearch.length >= 2) &&
                                                <div className="absolute z-50 w-full bg-popover border rounded-lg shadow-2xl
                                                    max-h-60 overflow-y-auto bottom-full mb-2 scrollbar-thin">
                                                    {data.length > 0 ?
                                                        data.map((suggestion, idx) =>
                                                            <div
                                                                key={idx}
                                                                role="button"
                                                                onClick={() => onClickSuggestion(suggestion.name)}
                                                                className="px-4 py-2 hover:bg-app-accent/30 hover:text-primary
                                                                cursor-pointer transition-colors border-b border-slate-800
                                                                last:border-none"
                                                            >
                                                                {suggestion.name}
                                                            </div>
                                                        )
                                                        :
                                                        <EmptyState
                                                            icon={SearchX}
                                                            className="py-6"
                                                            message={`No movies found for '${debouncedSearch}'`}
                                                        />
                                                    }
                                                </div>
                                            }
                                        </div>
                                        <div className="flex gap-2">
                                            <Button className="flex-1" variant="emeraldy" onClick={onSkipClick}>
                                                Skip
                                            </Button>
                                            <Button className="flex-2" onClick={onGuessClick} disabled={!guess}>
                                                Submit Guess
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            }
                        </div>
                    </CardContent>
                </Card>
                <div className="space-y-6">
                    <div className="grid gap-2 grid-cols-3 max-sm:grid-cols-2">
                        <SimpleStatCard
                            title="Total Played"
                            value={mediadleData?.stats?.totalPlayed ?? 0}
                        />
                        <SimpleStatCard
                            title="Total Won"
                            value={mediadleData?.stats?.totalWon ?? 0}
                        />
                        <SimpleStatCard
                            title="Win Rate"
                            value={`${mediadleData?.stats?.winRate?.toFixed(1) ?? 0.0}%`}
                        />
                        <SimpleStatCard
                            title="Current Streak"
                            value={mediadleData?.stats?.currentStreak ?? 0}
                        />
                        <SimpleStatCard
                            title="Best Streak"
                            value={mediadleData?.stats?.bestStreak ?? 0}
                        />
                        <SimpleStatCard
                            title="Avg. Attempts"
                            value={mediadleData?.stats?.averageAttempts?.toFixed(2) ?? 0.0}
                        />
                    </div>
                    <div className="mb-10">
                        <h4 className="text-sm font-semibold text-primary mb-3">
                            Guess Distribution
                        </h4>
                        <div className="space-y-3">
                            {[1, 2, 3, 4, 5].map((num) => {
                                const count = frequencyMap[num] ?? 0;
                                const percentage = maxFreq > 0 ? (count / maxFreq) * 100 * 0.9 : 0;

                                return (
                                    <div key={num} className="flex items-center gap-3 text-sm">
                                        <span className="w-2 font-mono text-primary">
                                            {num}
                                        </span>
                                        <div className="flex-1 h-6 bg-popover rounded-r-md overflow-hidden flex items-center">
                                            <div
                                                style={{ width: `${Math.max(percentage, 8)}%` }}
                                                className="h-full transition-all duration-500 bg-app-accent/50"
                                            />
                                            <span className="ml-2 text-xs font-bold text-primary">
                                                {count}
                                            </span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </PageTitle>
    );
}
