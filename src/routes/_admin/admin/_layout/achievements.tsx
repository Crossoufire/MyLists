import {useEffect, useState} from "react";
import {Badge} from "@/lib/components/ui/badge";
import {Input} from "@/lib/components/ui/input";
import {Label} from "@/lib/components/ui/label";
import {capitalize} from "@/lib/utils/functions";
import {Button} from "@/lib/components/ui/button";
import {Textarea} from "@/lib/components/ui/textarea";
import {createFileRoute} from "@tanstack/react-router";
import {useSuspenseQuery} from "@tanstack/react-query";
import {DashboardShell} from "@/lib/components/admin/DashboardShell";
import {DashboardHeader} from "@/lib/components/admin/DashboardHeader";
import {adminAchievementsOptions, adminQueryKeys} from "@/lib/react-query/query-options/admin-options";
import {Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle} from "@/lib/components/ui/card";
import {Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle} from "@/lib/components/ui/dialog";
import {useAdminUpdateAchievementMutation, useAdminUpdateTiersMutation} from "@/lib/react-query/query-mutations/admin.mutations";


export const Route = createFileRoute("/_admin/admin/_layout/achievements")({
    loader: async ({ context: { queryClient } }) => {
        return queryClient.ensureQueryData(adminAchievementsOptions());
    },
    component: AchievementPage,
})


function AchievementPage() {
    const [editedName, setEditedName] = useState("");
    const [editableTiers, setEditableTiers] = useState<any[]>([]);
    const [editedDescription, setEditedDescription] = useState("");
    const [editedMediaType, setEditedMediaType] = useState<any>("");
    const [isTierDialogOpen, setIsTierDialogOpen] = useState(false);
    const apiData = useSuspenseQuery(adminAchievementsOptions()).data;
    const [editingAchievement, setEditingAchievement] = useState<any | null>(null);
    const [isAchievementEditDialogOpen, setIsAchievementEditDialogOpen] = useState(false);
    const updateAchievementMutation = useAdminUpdateAchievementMutation(adminQueryKeys.adminAchievementsKey());
    const updateTiersMutation = useAdminUpdateTiersMutation(adminQueryKeys.adminAchievementsKey());

    useEffect(() => {
        if (isAchievementEditDialogOpen && editingAchievement) {
            setEditedName(editingAchievement.name);
            setEditedMediaType(editingAchievement.mediaType);
            setEditedDescription(editingAchievement.description);
        }
    }, [isAchievementEditDialogOpen, editingAchievement]);

    useEffect(() => {
        if (isTierDialogOpen && editingAchievement) {
            setEditableTiers(JSON.parse(JSON.stringify(editingAchievement.tiers || [])));
        }
    }, [isTierDialogOpen, editingAchievement]);

    const openAchievementEditDialog = (achievement: any) => {
        setEditingAchievement(achievement);
        setIsAchievementEditDialogOpen(true);
    };

    const handleSaveAchievementChanges = async () => {
        if (!editingAchievement) return;
        setIsAchievementEditDialogOpen(false);

        updateAchievementMutation.mutate({
            achievementId: editingAchievement.id,
            payload: {
                name: editedName,
                description: editedDescription,
            }
        });
    };

    const handleCancelAchievementEdit = () => {
        setIsAchievementEditDialogOpen(false);
    };

    const openTierEditDialog = (achievement: any) => {
        setIsTierDialogOpen(true);
        setEditingAchievement(achievement);
    };

    const handleTierCountChange = (tierId: number, value: string) => {
        const count = parseInt(value, 10);

        setEditableTiers((currentTiers) =>
            currentTiers.map((tier) => (tier.id === tierId) ?
                { ...tier, criteria: { count: isNaN(count) ? 0 : count } } : tier
            ),
        );
    };

    const handleSaveTierChanges = async () => {
        if (!editingAchievement) return;
        setIsTierDialogOpen(false);

        updateTiersMutation.mutate({ payloads: editableTiers });
    };

    const handleCancelTierEdit = () => {
        setIsTierDialogOpen(false);
    };

    return (
        <DashboardShell>
            <DashboardHeader heading="Achievements" description="Manage achievement definitions and tiers."/>
            <div className="grid gap-6">
                <h2 className="text-2xl font-bold">Achievement Management</h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {apiData.map((achievement) => (
                        <Card key={achievement.id}>
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <CardTitle>{achievement.name}</CardTitle>
                                    </div>
                                    <Badge variant="outline">
                                        {capitalize(achievement.mediaType!)}
                                    </Badge>
                                </div>
                                <CardDescription className="h-8">
                                    {achievement.description}
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    <h3 className="font-semibold">Achievement Tiers</h3>
                                    <div className="space-y-2">
                                        {achievement.tiers.map((tier) => (
                                            <div key={tier.difficulty} className="grid grid-cols-2 gap-2 text-sm">
                                                <div>{capitalize(tier.difficulty)}</div>
                                                <div>Criteria: {tier.criteria.count}</div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                            <CardFooter className="flex justify-between">
                                <Button size="sm" variant="outline" onClick={() => openAchievementEditDialog(achievement)}>
                                    Edit Details
                                </Button>
                                <Button variant="secondary" size="sm" onClick={() => openTierEditDialog(achievement)}>
                                    Edit Tiers
                                </Button>
                            </CardFooter>
                        </Card>
                    ))}
                </div>
            </div>
            <Dialog open={isAchievementEditDialogOpen} onOpenChange={setIsAchievementEditDialogOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Edit Achievement Details</DialogTitle>
                        <DialogDescription>Modify the core details of the achievement.</DialogDescription>
                    </DialogHeader>
                    {editingAchievement && (
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="name" className="text-right">Name</Label>
                                <Input
                                    id="name"
                                    value={editedName}
                                    className="col-span-3"
                                    disabled={updateAchievementMutation.isPending}
                                    onChange={(ev) => setEditedName(ev.target.value)}
                                />
                            </div>
                            <div className="grid grid-cols-4 items-center gap-4">
                                <Label htmlFor="description" className="text-right">Description</Label>
                                <Textarea
                                    id="description"
                                    className="col-span-3"
                                    value={editedDescription}
                                    disabled={updateAchievementMutation.isPending}
                                    onChange={(ev) => setEditedDescription(ev.target.value)}
                                />
                            </div>
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelAchievementEdit}
                            disabled={updateAchievementMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleSaveAchievementChanges}
                            disabled={updateAchievementMutation.isPending || !editedName || !editedDescription || !editedMediaType}
                        >
                            Save Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
            <Dialog open={isTierDialogOpen} onOpenChange={setIsTierDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Edit Tiers for: {editingAchievement?.name}</DialogTitle>
                        <DialogDescription>Adjust the criteria count for each difficulty tier.</DialogDescription>
                    </DialogHeader>
                    {editingAchievement && (
                        <div className="grid gap-4 py-4">
                            {editableTiers.map((tier) => (
                                <div key={tier.difficulty} className="grid grid-cols-3 items-center gap-4">
                                    <Label htmlFor={`tier-${tier.difficulty}`} className="text-right">
                                        {capitalize(tier.difficulty)}
                                    </Label>
                                    <Input
                                        min="0"
                                        id={tier.id}
                                        type="number"
                                        className="col-span-2"
                                        value={tier.criteria.count}
                                        disabled={updateAchievementMutation.isPending}
                                        onChange={(ev) => handleTierCountChange(tier.id, ev.target.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={handleCancelTierEdit}
                            disabled={updateAchievementMutation.isPending}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveTierChanges} disabled={updateAchievementMutation.isPending}>
                            Save Tier Changes
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardShell>
    );
}
