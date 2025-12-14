import {useRef, useState} from "react";
import {MediaType} from "@/lib/utils/enums";
import * as htmlToImage from "html-to-image";
import {useQuery} from "@tanstack/react-query";
import {Label} from "@/lib/client/components/ui/label";
import {Switch} from "@/lib/client/components/ui/switch";
import {Button} from "@/lib/client/components/ui/button";
import {FeaturedMediaData} from "@/lib/client/social-card/types";
import {useDragReorder} from "@/lib/client/hooks/use-drag-reorder";
import {PageTitle} from "@/lib/client/components/general/PageTitle";
import {mediaStatsOptions} from "@/lib/client/hooks/use-media-stats";
import {ProfileIcon} from "@/lib/client/components/general/ProfileIcon";
import {CardCanvas} from "@/lib/client/components/social-card/CardCanvas";
import {useStatCardBuilder} from "@/lib/client/hooks/use-stat-card-builder";
import {getAccentClasses, MEDIA_CONFIGS} from "@/lib/client/social-card/media.config";
import {ComponentPalette} from "@/lib/client/components/social-card/ComponentPalette";
import {MediaPickerModal} from "@/lib/client/components/social-card/MediaPickerModal";
import {TimeframeSelector} from "@/lib/client/components/social-card/TimeframeSelector";
import {Card, CardAction, CardContent, CardFooter, CardHeader, CardTitle} from "@/lib/client/components/ui/card";


interface StatCardBuilderProps {
    mediaType: MediaType;
}


const CURRENT_YEAR = new Date().getFullYear();


export function StatCardBuilder({ mediaType }: StatCardBuilderProps) {
    const accent = getAccentClasses(mediaType);
    const mediaConfig = MEDIA_CONFIGS[mediaType];
    const cardRef = useRef<HTMLDivElement>(null);
    const [isExporting, setIsExporting] = useState(false);
    const [editingSlotIndex, setEditingSlotIndex] = useState<number | null>(null);
    const [editingInstanceId, setEditingInstanceId] = useState<number | null>(null);

    const {
        timeframe,
        activeComps,
        showPreview,
        usedUnits,
        maxUnits,
        setShowPreview,
        addComponent,
        removeComponent,
        updateManualData,
        reorderComponents,
        resetToDefault,
        setTimeframe,
        canAddComponent,
        canAddLayout,
        changeComponentLayout,
    } = useStatCardBuilder({ mediaType });

    const {
        draggedIndex,
        dragOverIndex,
        handleDragStart,
        handleDragOver,
        handleDragEnd,
        handleTouchStart,
        handleTouchMove,
        handleTouchEnd,
    } = useDragReorder({ onReorder: reorderComponents });

    const { data: stats, isLoading: statsLoading } = useQuery(mediaStatsOptions(mediaType, timeframe));

    console.log({ stats, statsLoading });

    const handleEditComponent = (instanceId: number, slotIndex?: number) => {
        setEditingInstanceId(instanceId);
        setEditingSlotIndex(slotIndex ?? null);
    };

    const handleMediaSelect = (media: FeaturedMediaData) => {
        if (editingInstanceId !== null) {
            updateManualData(editingInstanceId, media, editingSlotIndex ?? undefined);
        }
    };

    const handleExport = async () => {
        if (!cardRef.current) return;

        setIsExporting(true);
        try {
            const blob = await exportCardAsImage(cardRef.current);
            const filename = `${mediaConfig.name.toLowerCase()}-recap-${timeframe}-${Date.now()}.png`;
            downloadImage(blob, filename);
        }
        catch (error) {
            console.error('Failed to export card:', error);
            alert('Failed to export image. Please try again.');
        }
        finally {
            setIsExporting(false);
        }
    };

    const handleCloseModal = () => {
        setEditingSlotIndex(null);
        setEditingInstanceId(null);
    };

    const MediaIcon = mediaConfig.icon;
    const editingComponent = activeComps.find((c) => c.instanceId === editingInstanceId);

    return (
        <PageTitle title={`${mediaConfig.name} Stat Card Builder`} subtitle={`Customize your ${mediaConfig.terminology.plural} stat card`}>
            <div className="grid gap-8 grid-cols-3 max-sm:grid-cols-1 mt-1">
                <div className="space-y-4 col-span-1">
                    <TimeframeSelector
                        timeframe={timeframe}
                        onChange={setTimeframe}
                    />
                    <ComponentPalette
                        maxUnits={maxUnits}
                        mediaType={mediaType}
                        usedUnits={usedUnits}
                        timeframe={timeframe}
                        canAddLayout={canAddLayout}
                        onAddComponent={addComponent}
                        canAddComponent={canAddComponent}
                    />
                </div>

                <div className="lg:col-span-2">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <div className="flex items-center space-x-2 rounded-lg bg-card px-4 py-2">
                            <Switch
                                id="preview"
                                checked={showPreview}
                                onCheckedChange={setShowPreview}
                                disabled={activeComps.length === 0}
                            />
                            <Label htmlFor="preview" className="cursor-pointer">
                                Preview
                            </Label>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={resetToDefault}>
                                Reset to Default
                            </Button>
                            <Button
                                onClick={handleExport}
                                disabled={activeComps.length === 0 || isExporting}
                                className={`${accent.bg} text-black hover:opacity-90`}
                            >
                                {isExporting ? "Exporting..." : "Export as Image"}
                            </Button>
                        </div>
                    </div>

                    <Card ref={cardRef}>
                        <CardHeader>
                            <CardTitle>
                                <div>
                                    <h2 className="flex items-center gap-3 text-4xl font-bold max-sm:text-2xl">
                                        <ProfileIcon
                                            fallbackSize="text-xl"
                                            className="size-12 max-sm:size-8"
                                            user={{ image: "", name: "Cross" }}
                                        />
                                        Cross
                                    </h2>
                                    <p className={`mt-1.5 text-sm ${accent.text}`}>
                                        {mediaConfig.name} Recap'
                                        {timeframe === "year" ? ` • ${CURRENT_YEAR}` : ""}
                                    </p>
                                </div>
                            </CardTitle>
                            <CardAction>
                                <MediaIcon
                                    className={`size-8 max-sm:size-6 ${accent.text}`}
                                />
                            </CardAction>
                        </CardHeader>

                        <CardContent>
                            <CardCanvas
                                stats={stats}
                                maxUnits={maxUnits}
                                mediaType={mediaType}
                                timeframe={timeframe}
                                usedUnits={usedUnits}
                                showPreview={showPreview}
                                activeComps={activeComps}
                                onDragEnd={handleDragEnd}
                                onRemove={removeComponent}
                                statsLoading={statsLoading}
                                onTouchEnd={handleTouchEnd}
                                draggedIndex={draggedIndex}
                                onDragOver={handleDragOver}
                                onEdit={handleEditComponent}
                                dragOverIndex={dragOverIndex}
                                onDragStart={handleDragStart}
                                onTouchMove={handleTouchMove}
                                onTouchStart={handleTouchStart}
                                onChangeLayout={changeComponentLayout}
                            />
                        </CardContent>

                        <CardFooter className="-mb-1 mt-1 flex items-center justify-center text-sm text-gray-400 max-sm:text-xs">
                            <a href="https://mylists.info">
                                https://mylists.info
                            </a>
                        </CardFooter>
                    </Card>
                </div>
            </div>

            {!showPreview &&
                <MediaPickerModal
                    open={
                        editingInstanceId !== null &&
                        (editingComponent?.compId === "featuredMedia" || editingComponent?.compId === "mediaShowcase")
                    }
                    mediaType={mediaType}
                    onClose={handleCloseModal}
                    onSelect={handleMediaSelect}
                />
            }
        </PageTitle>
    );
}


async function exportCardAsImage(cardElement: HTMLElement) {
    try {
        const blob = await htmlToImage.toBlob(cardElement, {});
        return blob!;
    }
    catch (error) {
        throw error;
    }
}


function downloadImage(blob: Blob, filename: string = "card.png") {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}
