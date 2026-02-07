import {useMemo, useState} from "react";
import {useAuth} from "@/lib/client/hooks/use-auth";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {Badge} from "@/lib/client/components/ui/badge";
import {Input} from "@/lib/client/components/ui/input";
import {Button} from "@/lib/client/components/ui/button";
import {Textarea} from "@/lib/client/components/ui/textarea";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {CalendarClock, CheckCircle2, Crown, Settings2} from "lucide-react";
import {featureVotesOptions} from "@/lib/client/react-query/query-options/query-options";
import {FeatureStatus, FeatureVoteType, isAtLeastRole, RoleType,} from "@/lib/utils/enums";
import {Card, CardContent, CardDescription, CardHeader, CardTitle,} from "@/lib/client/components/ui/card";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger} from "@/lib/client/components/ui/dialog";
import {
    useCreateFeatureRequestMutation,
    useDeleteFeatureRequestMutation,
    useToggleFeatureVoteMutation,
    useUpdateFeatureStatusMutation
} from "@/lib/client/react-query/query-mutations/feature-votes.mutations";


export const Route = createFileRoute("/_main/_private/features-vote")({
    loader: ({ context: { queryClient } }) => queryClient.ensureQueryData(featureVotesOptions),
    component: FeatureVotesPage,
});


const STATUS_STYLES: Record<FeatureStatus, string> = {
    [FeatureStatus.PLANNED]: "border-sky-500/40 text-sky-200 bg-sky-500/10",
    [FeatureStatus.REJECTED]: "border-rose-500/40 text-rose-200 bg-rose-500/10",
    [FeatureStatus.COMPLETED]: "border-violet-500/40 text-violet-200 bg-violet-500/10",
    [FeatureStatus.IN_PROGRESS]: "border-emerald-500/40 text-emerald-200 bg-emerald-500/10",
    [FeatureStatus.UNDER_CONSIDERATION]: "border-amber-500/40 text-amber-200 bg-amber-500/10",
};


function FeatureVotesPage() {
    const { currentUser } = useAuth();
    const [newTitle, setNewTitle] = useState("");
    const toggleVoteMutation = useToggleFeatureVoteMutation();
    const apiData = useSuspenseQuery(featureVotesOptions).data;
    const createFeatureMutation = useCreateFeatureRequestMutation();
    const [newDescription, setNewDescription] = useState("");
    const isAdmin = isAtLeastRole(currentUser?.role ?? null, RoleType.ADMIN);
    const availableSuperVotes = Math.max(0, apiData.superVoteLimit - apiData.superVotesUsed);

    const filteredRequests = useMemo(() => {
        return [...apiData.items].sort((a, b) => b.totalVotes - a.totalVotes);
    }, [apiData.items]);

    const getMutationError = (error: any) => {
        if (!error) return null;

        if (error.issues && Array.isArray(error.issues) && error.issues.length > 0) {
            return error.issues[0].message;
        }

        return error.message || "An unexpected error occurred";
    };

    const handleAddNewFeature = () => {
        createFeatureMutation.mutate({ data: { title: newTitle.trim(), description: newDescription.trim() } }, {
            onSuccess: () => {
                setNewTitle("");
                setNewDescription("");
            },
        });
    };

    const handleVote = (featureId: number, voteType: FeatureVoteType) => {
        toggleVoteMutation.mutate({ data: { featureId, voteType } });
    };

    return (
        <PageTitle title="Feature Voting Hub" subtitle="Submit ideas, search, and vote on what MyLists should have next.">
            <div className="space-y-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Quick Q&A</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <dl className="space-y-4 text-sm text-muted-foreground">
                            <div>
                                <dt className="font-semibold text-primary">
                                    How do votes work?
                                </dt>
                                <dd>
                                    Each feature gets one vote per user. You can rescind it while voting
                                    is open.
                                </dd>
                            </div>
                            <div>
                                <dt className="font-semibold text-primary">
                                    What are super-votes?
                                </dt>
                                <dd>
                                    You always have {apiData.superVoteLimit} super-votes worth{" "}
                                    {apiData.superVoteWeight} votes each. They are refunded
                                    automatically if an idea is rejected or completed.
                                </dd>
                            </div>
                        </dl>
                    </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
                    <Card className="border-app-accent/40">
                        <CardHeader>
                            <CardTitle>Propose a new feature</CardTitle>
                            <CardDescription>
                                Share a short title and optional description.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Input
                                value={newTitle}
                                placeholder="Feature title"
                                onChange={(ev) => setNewTitle(ev.target.value)}
                            />
                            <Textarea
                                rows={3}
                                value={newDescription}
                                placeholder="Optional: add a short context or use-case."
                                onChange={(ev) => setNewDescription(ev.target.value)}
                            />
                            {createFeatureMutation.isError &&
                                <p className="text-xs text-red-400">
                                    {getMutationError(createFeatureMutation.error)}
                                </p>
                            }
                            <div className="flex items-center justify-center">
                                <Button onClick={handleAddNewFeature} disabled={createFeatureMutation.isPending}>
                                    Add Feature for Voting
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-app-accent/40">
                        <CardHeader>
                            <CardTitle>Your Voting Power</CardTitle>
                            <CardDescription>Use your normal and super-votes wisely.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex items-center justify-between rounded-lg border px-4 py-3">
                                <div>
                                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                                        Super-votes available
                                    </p>
                                    <p className="text-2xl font-bold text-primary">
                                        {availableSuperVotes}
                                        <span className="text-sm text-muted-foreground"> / {apiData.superVoteLimit}</span>
                                    </p>
                                </div>
                                <div className="rounded-full bg-popover/60 border p-3 text-app-accent">
                                    <Crown className="size-5"/>
                                </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                                Super-votes are refund automatically when a feature ships or gets rejected.
                            </div>
                            <div className="grid grid-cols-2 gap-3 text-xs text-muted-foreground">
                                <div className="rounded-lg border px-3 py-2">
                                    <span className="block font-semibold text-primary">Normal vote</span>
                                    +1 total vote
                                </div>
                                <div className="rounded-lg border px-3 py-2">
                                    <span className="block font-semibold text-primary">Super vote</span>
                                    +{apiData.superVoteWeight} total votes
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4">
                    {filteredRequests.map((req) => {
                        const isLocked = req.status === FeatureStatus.REJECTED || req.status === FeatureStatus.COMPLETED;
                        const isNormalVote = req.userVote === FeatureVoteType.VOTE;
                        const isSuperVote = req.userVote === FeatureVoteType.SUPER;
                        const normalVoteLabel = isNormalVote ? "Rescind vote" : "Vote";
                        const superVoteLabel = isSuperVote ? "Rescind super-vote" : "Super Vote";

                        return (
                            <Card key={req.id} className="relative overflow-hidden">
                                <CardHeader>
                                    <div className="flex flex-wrap items-start justify-between gap-3">
                                        <div className="space-y-1">
                                            <CardTitle>{req.title}</CardTitle>
                                            <CardDescription>{req.description}</CardDescription>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge className={STATUS_STYLES[req.status]}>
                                                {req.status}
                                            </Badge>
                                            <div className="rounded-lg border px-3 py-1 text-xs text-muted-foreground">
                                                {req.totalVotes} votes
                                            </div>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                        <div className="flex items-center gap-1">
                                            <CalendarClock className="size-3"/>
                                            Created {req.createdAt}
                                        </div>
                                        {req.userVote &&
                                            <div className="flex items-center gap-1 text-emerald-300">
                                                <CheckCircle2 className="size-3"/>
                                                You cast a{" "}
                                                {req.userVote === FeatureVoteType.SUPER ? "super-vote" : "vote"}
                                            </div>
                                        }
                                    </div>

                                    {req.adminComment &&
                                        <div className="rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground">
                                            <span className="font-semibold text-primary">
                                                Admin note:
                                            </span>{" "}
                                            {req.adminComment}
                                        </div>
                                    }

                                    <div className="flex flex-wrap items-center justify-between">
                                        <div className="flex flex-wrap items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant={isNormalVote ? "emeraldy" : "outline"}
                                                onClick={() => handleVote(req.id, FeatureVoteType.VOTE)}
                                                disabled={toggleVoteMutation.isPending || isLocked}
                                            >
                                                {normalVoteLabel}
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant={isSuperVote ? "emeraldy" : "outline"}
                                                onClick={() => handleVote(req.id, FeatureVoteType.SUPER)}
                                                disabled={
                                                    isLocked ||
                                                    toggleVoteMutation.isPending ||
                                                    (availableSuperVotes <= 0 && !isSuperVote)
                                                }
                                            >
                                                <Crown className="size-3 mr-1"/>
                                                {superVoteLabel}
                                            </Button>
                                        </div>

                                        {isAdmin &&
                                            <AdminFeatureControls
                                                featureId={req.id}
                                                currentStatus={req.status}
                                                currentComment={req.adminComment}
                                            />
                                        }
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            </div>
        </PageTitle>
    );
}


interface AdminFeatureControlsProps {
    featureId: number;
    currentStatus: FeatureStatus;
    currentComment: string | null;
}


export function AdminFeatureControls({ featureId, currentStatus, currentComment }: AdminFeatureControlsProps) {
    const [open, setOpen] = useState(false);
    const [note, setNote] = useState(currentComment ?? "");
    const updateStatusMutation = useUpdateFeatureStatusMutation();
    const deleteFeatureMutation = useDeleteFeatureRequestMutation();
    const [status, setStatus] = useState<FeatureStatus>(currentStatus);

    const handleSave = () => {
        updateStatusMutation.mutate({ data: { featureId, status, adminComment: note } }, {
            onSuccess: () => setOpen(false),
        });
    };

    const handleDelete = () => {
        if (!window.confirm("Delete this feature request and all its votes?")) return;

        deleteFeatureMutation.mutate({ data: { featureId } }, {
            onSuccess: () => setOpen(false),
        });
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                    <Settings2 className="size-3"/>
                    Admin Management
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Admin Management</DialogTitle>
                    <DialogDescription>
                        Update the status of this feature request and add internal or public
                        commentary.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Feature Status
                        </label>
                        <select
                            value={status}
                            disabled={updateStatusMutation.isPending}
                            onChange={(ev) => setStatus(ev.target.value as FeatureStatus)}
                            className="flex h-10 w-full rounded-md border border-input bg-background px-3  py-2 text-sm
                            ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                        >
                            {Object.values(FeatureStatus).map((fs) =>
                                <option key={fs} value={fs}>
                                    {fs}
                                </option>
                            )}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium leading-none">
                            Admin Note
                        </label>
                        <Textarea
                            rows={4}
                            value={note}
                            disabled={updateStatusMutation.isPending}
                            onChange={(ev) => setNote(ev.target.value)}
                            placeholder="Provide context on why this status was chosen..."
                        />
                    </div>
                </div>

                <div className="rounded-lg border border-dashed border-destructive/60 bg-destructive/10 px-4 py-3 text-xs text-muted-foreground">
                    <p className="font-semibold text-destructive">Delete request</p>
                    <p>This permanently removes the feature request and all votes.</p>
                    <Button
                        size="sm"
                        type="button"
                        className="mt-3"
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={deleteFeatureMutation.isPending}
                    >
                        {deleteFeatureMutation.isPending ? "Deleting..." : "Delete feature request"}
                    </Button>
                </div>

                <DialogFooter>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setOpen(false)}
                        disabled={updateStatusMutation.isPending || deleteFeatureMutation.isPending}
                    >
                        Cancel
                    </Button>
                    <Button
                        type="button"
                        onClick={handleSave}
                        disabled={updateStatusMutation.isPending || deleteFeatureMutation.isPending}
                    >
                        {updateStatusMutation.isPending ? "Saving..." : "Save Changes"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
