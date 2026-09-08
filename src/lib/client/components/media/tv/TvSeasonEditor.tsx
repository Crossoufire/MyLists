import {Minus, Plus} from "lucide-react";
import {useQuery} from "@tanstack/react-query";
import {REDO_MAX} from "@/lib/utils/constants";
import {Button} from "@/lib/client/components/ui/button";
import {TvMediaType, UpdateType} from "@/lib/utils/enums";
import {ButtonGroup} from "@/lib/client/components/ui/button-group";
import {RatingSelect} from "@/lib/client/components/media/base/RatingSelect";
import {Field, FieldGroup, FieldLabel} from "@/lib/client/components/ui/field";
import {tvSeasonsOptions} from "@/lib/client/react-query/query-options/tv-seasons.options";
import {useUpdateUserMediaMutation} from "@/lib/client/react-query/query-mutations/user-media.mutations";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


interface TvSeasonEditorProps {
    open: boolean;
    userId: number;
    mediaId: number;
    mediaType: TvMediaType;
    mode: "rating" | "redo";
    onOpenChange: (open: boolean) => void;
    mutation: ReturnType<typeof useUpdateUserMediaMutation>;
}


export const TvSeasonEditor = ({ open, onOpenChange, mode, mediaType, mediaId, userId, mutation }: TvSeasonEditorProps) => {
    const query = useQuery({ ...tvSeasonsOptions(mediaType, mediaId, userId), enabled: open });
    const seasons = query.data ?? [];
    const active = seasons.filter(s => s.episodes !== null);
    const pending = mutation.isPending || query.isFetching;
    const changeRating = (season: number, rating: number | null) => {
        mutation.mutate({ payload: { type: UpdateType.RATING, seasonRating: { season, rating } } });
    };
    const changeRedos = (seasonRedos: { season: number; redo: number }[]) => {
        mutation.mutate({ payload: { type: UpdateType.REDO, seasonRedos } });
    };
    const changeAll = (amount: number) => changeRedos(active.map(s => ({
        season: s.season,
        redo: Math.min(REDO_MAX, Math.max(0, s.redo + amount)),
    })));

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-100 max-sm:w-full">
                <DialogHeader>
                    <DialogTitle>{mode === "rating" ? "Season ratings" : "Re-watched seasons"}</DialogTitle>
                    <DialogDescription>
                        {mode === "rating" ? "Your overall rating is the average of rated current seasons." : "Manage how many times you have re-watched each season."} Changes save
                        automatically.
                    </DialogDescription>
                </DialogHeader>
                {query.isPending && <p role="status">Loading seasons…</p>}
                {query.isError && <div role="alert">Could not load seasons. <Button variant="ghost" onClick={() => query.refetch()}>Retry</Button></div>}
                {mode === "redo" && active.length > 0 &&
                    <div className="flex items-center justify-between">
                        <span>All current seasons</span>
                        <ButtonGroup aria-label="Adjust all season rewatches">
                            <Button
                                size="icon"
                                variant="outline"
                                aria-label="Decrease all season rewatches"
                                disabled={pending || active.every(s => s.redo === 0)}
                                onClick={() => changeAll(-1)}
                            >
                                <Minus/>
                            </Button>
                            <Button
                                size="icon"
                                variant="outline"
                                aria-label="Increase all season rewatches"
                                disabled={pending || active.every(s => s.redo === REDO_MAX)}
                                onClick={() => changeAll(1)}
                            >
                                <Plus/>
                            </Button>
                        </ButtonGroup>
                    </div>
                }
                <FieldGroup className="max-h-80 gap-3 overflow-y-auto scrollbar-thin pr-1">
                    {seasons.map(s => (
                        <Field key={s.season} orientation="horizontal" className="justify-between">
                            <div className="flex flex-col gap-0.5">
                                <FieldLabel>Season {s.season}</FieldLabel>
                                <span className="text-xs text-muted-foreground">{s.episodes === null ? "Unavailable · excluded from totals" : `${s.episodes} episodes`}</span>
                            </div>
                            {s.episodes === null ?
                                <Button
                                    size="sm"
                                    variant="outline"
                                    disabled={pending || (mode === "rating" ? s.rating === null : s.redo === 0)}
                                    onClick={() => mode === "rating" ? changeRating(s.season, null) : changeRedos([{ season: s.season, redo: 0 }])}
                                >
                                    Clear {mode === "rating" ? s.rating ?? "rating" : `${s.redo}×`}
                                </Button>
                                : mode === "rating" ?
                                    <RatingSelect
                                        rating={s.rating}
                                        disabled={pending}
                                        label={`Season ${s.season} rating`}
                                        onChange={rating => changeRating(s.season, rating)}
                                    />
                                    :
                                    <div className="flex items-center gap-3">
                                        <span className="tabular-nums">{s.redo}×</span>
                                        <ButtonGroup aria-label={`Season ${s.season} rewatches`}>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                disabled={pending || s.redo === 0}
                                                aria-label={`Decrease season ${s.season} rewatches`}
                                                onClick={() => changeRedos([{ season: s.season, redo: s.redo - 1 }])}
                                            >
                                                <Minus/>
                                            </Button>
                                            <Button
                                                size="icon"
                                                variant="outline"
                                                disabled={pending || s.redo === REDO_MAX}
                                                aria-label={`Increase season ${s.season} rewatches`}
                                                onClick={() => changeRedos([{ season: s.season, redo: s.redo + 1 }])}
                                            >
                                                <Plus/>
                                            </Button>
                                        </ButtonGroup>
                                    </div>
                            }
                        </Field>
                    ))}
                </FieldGroup>
                <DialogFooter><Button variant="outline" onClick={() => onOpenChange(false)}>Done</Button></DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
