import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {MediaType} from "@/lib/utils/enums";
import {useQuery} from "@tanstack/react-query";
import {getMediaUnitLabel} from "@/lib/utils/mapping";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {Button} from "@/lib/client/components/ui/button";
import {SectionParams} from "@/lib/types/activity.types";
import {Checkbox} from "@/lib/client/components/ui/checkbox";
import {specificActivityOptions} from "@/lib/client/react-query/query-options/query-options";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";
import {useDeleteActivityMutation, useUpdateActivityMutation} from "@/lib/client/react-query/query-mutations/activity.mutations";


interface ActivityEditDialogProps {
    year: number;
    open: boolean;
    month: number;
    mediaId: number;
    username: string;
    mediaName: string;
    mediaType: MediaType;
    sectionParams: SectionParams;
    onOpenChange: (open: boolean) => void;
}


type FormValues = {
    isRedo: boolean,
    lastUpdate: string,
    isCompleted: boolean,
    specificGained: number,
}


export const ActivityEditDialog = (props: ActivityEditDialogProps) => {
    const { open, year, month, mediaId, username, mediaType, mediaName, onOpenChange, sectionParams } = props;

    const updateMutation = useUpdateActivityMutation(username, sectionParams);
    const deleteMutation = useDeleteActivityMutation(username, sectionParams);
    const { data: event, isLoading } = useQuery(specificActivityOptions({ username, year, month, mediaType, mediaId }, open));
    const form = useForm<FormValues>({
        values: {
            isRedo: event?.isRedo ?? false,
            lastUpdate: event?.lastUpdate ?? "",
            isCompleted: event?.isCompleted ?? false,
            specificGained: event?.specificGained ?? 0,
        }
    });

    if (isLoading) {
        return null;
    }

    const handleOnSave = (data: FormValues) => {
        if (!data) return;

        updateMutation.mutate({
            data: {
                activityId: event!.id,
                payload: {
                    isRedo: data.isRedo,
                    lastUpdate: data.lastUpdate,
                    isCompleted: data.isCompleted,
                    specificGained: Number(data.specificGained),
                }
            }
        }, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success("Activity updated");
            }
        });
    };

    const handleOnDelete = () => {
        if (!event || !window.confirm("Delete this activity event?")) return;
        deleteMutation.mutate({ data: { activityId: event.id } }, {
            onSuccess: () => {
                onOpenChange(false);
                toast.success("Activity deleted");
            }
        });
    };

    const specificLabel = mediaType === MediaType.GAMES
        ? "Minutes gained"
        : (getMediaUnitLabel(mediaType, "long") ?? "Units gained");

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-100 max-sm:w-full">
                <DialogHeader>
                    <DialogTitle>Edit Activity - {mediaName}</DialogTitle>
                    <DialogDescription>Adjust or remove this monthly activity.</DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleOnSave)} className="space-y-5 mt-2">
                    <div className="grid gap-2">
                        <Label htmlFor="specificGained">{specificLabel}</Label>
                        <Input
                            type="number"
                            {...form.register("specificGained", { required: true, min: 0 })}
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="lastUpdate">Last Update (UTC)</Label>
                        <Input
                            placeholder="YYYY-MM-DD HH:mm:ss"
                            {...form.register("lastUpdate")}
                        />
                    </div>

                    <div className="flex flex-wrap gap-4">
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={!form.watch().isCompleted && !form.watch().isRedo}
                                onCheckedChange={() => {
                                    form.setValue("isRedo", false);
                                    form.setValue("isCompleted", false);
                                }}
                            />
                            Progress
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.watch().isCompleted}
                                onCheckedChange={(val) => {
                                    form.setValue("isCompleted", !!val);
                                    if (val) form.setValue("isRedo", false);
                                }}
                            />
                            Completed
                        </label>
                        <label className="flex items-center gap-2 text-sm">
                            <Checkbox
                                checked={form.watch().isRedo}
                                onCheckedChange={(val) => {
                                    form.setValue("isRedo", !!val);
                                    if (val) form.setValue("isCompleted", false);
                                }}
                            />
                            Redo
                        </label>
                    </div>

                    <DialogFooter className="pt-2 mx-auto gap-3">
                        <Button type="button" variant="destructive" onClick={handleOnDelete} disabled={deleteMutation.isPending}>
                            Delete
                        </Button>
                        <Button type="submit" disabled={updateMutation.isPending}>
                            Save changes
                        </Button>
                    </DialogFooter>
                </form>

                <div className="text-xs text-red-300">
                    <b>Note:</b> These values determine how your time is allocated to your{" "}
                    <b>monthly</b> and <b>yearly recaps</b>. For example, you can log a show you watched years
                    ago without it inflating your current monthly/yearly recap. This does not affect your total lifetime
                    progress—only how it is distributed in your history.
                </div>
            </DialogContent>
        </Dialog>
    );
};
