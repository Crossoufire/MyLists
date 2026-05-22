import {toast} from "sonner";
import {useForm} from "react-hook-form";
import {MediaType} from "@/lib/utils/enums";
import {SlidersHorizontal} from "lucide-react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {Input} from "@/lib/client/components/ui/input";
import {Label} from "@/lib/client/components/ui/label";
import {toDateInputValue} from "@/lib/utils/formating";
import {Button} from "@/lib/client/components/ui/button";
import {useBulkHideActivityMutation} from "@/lib/client/react-query/query-mutations/activity.mutations";
import {Select, SelectContent, SelectItem, SelectTrigger, SelectValue} from "@/lib/client/components/ui/select";
import {Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle} from "@/lib/client/components/ui/dialog";


type FormValues = {
    endDate: string;
    startDate: string;
    mediaType: MediaType | "all";
}


interface ActivityCleanupDialogProps {
    open: boolean;
    mediaType: MediaType | "all";
    onOpenChange: (open: boolean) => void;
}


export const ActivityCleanupDialog = ({ open, mediaType, onOpenChange }: ActivityCleanupDialogProps) => {
    const { currentUser } = useAuth();
    const bulkMutation = useBulkHideActivityMutation();
    const today = toDateInputValue(new Date().toISOString());
    const availableMediaTypes = mediaType === "all" ? Object.values(MediaType) : [mediaType];
    const accountCreatedAt = currentUser?.createdAt ? toDateInputValue(currentUser.createdAt.toISOString()) : today;
    const form = useForm<FormValues>({
        values: {
            mediaType,
            startDate: accountCreatedAt,
            endDate: addDays(accountCreatedAt, 60, today),
        },
    });

    const applyPreset = (days: number) => {
        form.setValue("startDate", accountCreatedAt);
        form.setValue("endDate", addDays(accountCreatedAt, days, today));
    };

    const handleSubmit = (values: FormValues) => {
        const confirmed = window.confirm("Hide matching activity? This keeps the rows editable and reversible.");
        if (!confirmed) return;

        bulkMutation.mutate({
            data: {
                endDate: values.endDate,
                startDate: values.startDate,
                mediaType: values.mediaType === "all" ? undefined : values.mediaType,
            },
        }, {
            onSuccess: (result) => {
                onOpenChange(false);
                toast.success(`Hidden ${result.count} activity row${result.count === 1 ? "" : "s"}`);
            },
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="w-[min(560px,calc(100vw-2rem))]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <SlidersHorizontal className="size-5 text-app-accent"/>
                        Setup Cleanup
                    </DialogTitle>
                    <DialogDescription>
                        Hide setup or import activity from recap totals without deleting it.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-5">
                    <div className="space-y-2">
                        <Label>Quick ranges (days since account creation)</Label>
                        <div className="flex flex-wrap gap-2">
                            <Button type="button" size="sm" variant="secondary" onClick={() => applyPreset(30)}>
                                First 30 days
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => applyPreset(60)}>
                                First 60 days
                            </Button>
                            <Button type="button" size="sm" variant="secondary" onClick={() => applyPreset(90)}>
                                First 90 days
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3 max-sm:grid-cols-1">
                        <div className="grid gap-2">
                            <Label>Start date</Label>
                            <Input
                                type="date"
                                max={today}
                                {...form.register("startDate", { required: true })}
                            />
                        </div>
                        <div className="grid gap-2">
                            <Label>End date</Label>
                            <Input
                                type="date"
                                max={today}
                                {...form.register("endDate", { required: true })}
                            />
                        </div>
                    </div>

                    <div className="grid gap-2">
                        <Label>Media type</Label>
                        <Select value={form.watch().mediaType} onValueChange={(v: any) => form.setValue("mediaType", v)}>
                            <SelectTrigger>
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {mediaType === "all" &&
                                    <SelectItem value="all">All types</SelectItem>
                                }
                                {availableMediaTypes.map((mediaType) =>
                                    <SelectItem key={mediaType} value={mediaType} className="capitalize">
                                        {mediaType}
                                    </SelectItem>
                                )}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-md border border-border bg-secondary/40 p-3 text-sm text-muted-foreground">
                        This is not month-specific. It applies to all activity rows with a progress date inside the selected range.
                    </div>

                    <div className="flex justify-end">
                        <Button type="submit" disabled={bulkMutation.isPending}>
                            Hide matching activity
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};


const addDays = (dateValue: string, days: number, maxDate: string) => {
    const date = new Date(`${dateValue}T00:00:00`);
    date.setDate(date.getDate() + days);
    const value = toDateInputValue(date.toISOString());

    return value > maxDate ? maxDate : value;
};
