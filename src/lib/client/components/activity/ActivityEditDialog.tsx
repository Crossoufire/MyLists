import {toast} from "sonner";
import {useEffect, useMemo, useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import {cn} from "@/lib/utils/helpers";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {Button} from "@/lib/client/components/ui/button";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {useQuery} from "@tanstack/react-query";
import {formatDateTime, formatMinutes} from "@/lib/utils/formating";
import {getMediaUnitLabel} from "@/lib/utils/mapping";
import {activityEventsOptions} from "@/lib/client/react-query/query-options/query-options";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";
import {useDeleteActivityEventMutation, useUpdateActivityEventMutation} from "@/lib/client/react-query/query-mutations/activity.mutations";


interface ActivityEditDialogProps {
    open: boolean;
    year: number;
    month: number;
    mediaId: number;
    username: string;
    mediaType: MediaType;
    mediaName: string;
    onOpenChange: (open: boolean) => void;
}

export const ActivityEditDialog = ({
    open,
    year,
    month,
    mediaId,
    username,
    mediaType,
    mediaName,
    onOpenChange,
}: ActivityEditDialogProps) => {
    const { data: events = [] } = useQuery({
        ...activityEventsOptions(username, { year, month, mediaType, mediaId }),
        enabled: open,
    });
    const updateMutation = useUpdateActivityEventMutation({ username, year, month, mediaType, mediaId });
    const deleteMutation = useDeleteActivityEventMutation({ username, year, month, mediaType, mediaId });

    const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
    const selectedEvent = useMemo(() => events.find((event) => event.id === selectedEventId) ?? null, [events, selectedEventId]);

    const [specificGained, setSpecificGained] = useState<string>("");
    const [timestamp, setTimestamp] = useState<string>("");
    const [isCompleted, setIsCompleted] = useState<boolean>(false);
    const [isRedo, setIsRedo] = useState<boolean>(false);

    useEffect(() => {
        if (!open) return;
        if (events.length > 0) {
            setSelectedEventId(events[0].id);
        }
        else {
            setSelectedEventId(null);
        }
    }, [open, mediaId, events]);

    useEffect(() => {
        if (!selectedEvent) return;
        setSpecificGained(String(selectedEvent.specificGained));
        setTimestamp(selectedEvent.timestamp);
        setIsCompleted(Boolean(selectedEvent.isCompleted));
        setIsRedo(Boolean(selectedEvent.isRedo));
    }, [selectedEvent]);

    const handleSave = () => {
        if (!selectedEvent) return;

        const nextSpecific = Number(specificGained);
        if (Number.isNaN(nextSpecific) || nextSpecific < 0) {
            toast.error("Specific gained must be a positive number.");
            return;
        }

        const payload: { specificGained?: number; isCompleted?: boolean; isRedo?: boolean; timestamp?: string } = {};

        if (nextSpecific !== selectedEvent.specificGained) payload.specificGained = nextSpecific;
        if (isCompleted !== Boolean(selectedEvent.isCompleted)) payload.isCompleted = isCompleted;
        if (isRedo !== Boolean(selectedEvent.isRedo)) payload.isRedo = isRedo;
        if (timestamp && timestamp !== selectedEvent.timestamp) payload.timestamp = timestamp;

        if (Object.keys(payload).length === 0) {
            toast.info("No changes to save.");
            return;
        }

        updateMutation.mutate({ data: { eventId: selectedEvent.id, payload } });
    };

    const handleDelete = () => {
        if (!selectedEvent) return;
        if (!window.confirm("Delete this activity event?")) return;

        deleteMutation.mutate({ data: { eventId: selectedEvent.id } }, {
            onSuccess: () => {
                setSelectedEventId(null);
            },
        });
    };

    const specificLabel = mediaType === MediaType.GAMES
        ? "Minutes gained"
        : (getMediaUnitLabel(mediaType, "long") ?? "Units gained");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl">
                <DialogHeader>
                    <DialogTitle>Edit activity - {mediaName}</DialogTitle>
                    <DialogDescription>
                        Adjust or remove individual activity events for this month.
                    </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Events</div>
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                            {events.length === 0 &&
                                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                                    No events found for this media.
                                </div>
                            }
                            {events.map((event) => (
                                <button
                                    key={event.id}
                                    type="button"
                                    onClick={() => setSelectedEventId(event.id)}
                                    className={cn(
                                        "flex w-full flex-col gap-1 rounded-md border p-3 text-left text-sm transition",
                                        event.id === selectedEventId ? "border-app-accent/60 bg-secondary/70" : "border-border hover:bg-secondary/30"
                                    )}
                                >
                                    <div className="flex items-center justify-between gap-2">
                                        <span className="font-medium">{formatDateTime(event.timestamp)}</span>
                                        <span className="text-xs text-muted-foreground">
                                            {mediaType === MediaType.GAMES
                                                ? formatMinutes(event.specificGained)
                                                : `+${event.specificGained} ${getMediaUnitLabel(mediaType, "short") ?? ""}`}
                                        </span>
                                    </div>
                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                        {event.isCompleted && <span>Completed</span>}
                                        {event.isRedo && <span>Redo</span>}
                                        {!event.isCompleted && !event.isRedo && <span>Progress</span>}
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="space-y-4">
                        <div className="grid gap-2">
                            <Label htmlFor="activity-specific-gained">{specificLabel}</Label>
                            <Input
                                id="activity-specific-gained"
                                type="number"
                                min={0}
                                value={specificGained}
                                onChange={(event) => setSpecificGained(event.target.value)}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="activity-timestamp">Timestamp (UTC)</Label>
                            <Input
                                id="activity-timestamp"
                                value={timestamp}
                                onChange={(event) => setTimestamp(event.target.value)}
                                placeholder="YYYY-MM-DD HH:mm:ss"
                            />
                        </div>
                        <div className="flex flex-wrap gap-4">
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={isCompleted} onCheckedChange={(value) => setIsCompleted(Boolean(value))}/>
                                Completed
                            </label>
                            <label className="flex items-center gap-2 text-sm">
                                <Checkbox checked={isRedo} onCheckedChange={(value) => setIsRedo(Boolean(value))}/>
                                Redo
                            </label>
                        </div>
                        <DialogFooter className="pt-2">
                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleDelete}
                                disabled={!selectedEvent || deleteMutation.isPending}
                            >
                                Delete event
                            </Button>
                            <Button
                                type="button"
                                onClick={handleSave}
                                disabled={!selectedEvent || updateMutation.isPending}
                            >
                                Save changes
                            </Button>
                        </DialogFooter>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};
