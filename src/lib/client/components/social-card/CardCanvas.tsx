import {MediaType} from "@/lib/utils/enums";
import {Maximize2, Pen, X} from "lucide-react";
import {Button} from "@/lib/client/components/ui/button";
import {UserStatsCard} from "@/lib/types/query.options.types";
import {getAccentClasses} from "@/lib/client/social-card/media.config";
import {StatBlock} from "@/lib/client/components/social-card/StatBlock";
import {COMPONENT_DEFS} from "@/lib/client/social-card/components-registry";
import {ActiveComponent, LAYOUTS, LayoutSize, Timeframe} from "@/lib/client/social-card/types";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "@/lib/client/components/ui/dropdown-menu";


interface CardCanvasProps {
    maxUnits: number;
    usedUnits: number;
    mediaType: MediaType;
    timeframe: Timeframe;
    showPreview: boolean;
    onDragEnd: () => void;
    statsLoading: boolean;
    onTouchEnd: () => void;
    draggedIndex: number | null;
    dragOverIndex: number | null;
    activeComps: ActiveComponent[];
    stats: UserStatsCard | undefined;
    onTouchStart: (index: number) => void;
    onRemove: (instanceId: number) => void;
    onEdit: (instanceId: number, slotIndex?: number) => void;
    onTouchMove: (ev: React.TouchEvent<HTMLDivElement>) => void;
    onChangeLayout: (instanceId: number, layout: LayoutSize) => void;
    onDragOver: (ev: React.DragEvent<HTMLDivElement>, index: number) => void;
    onDragStart: (ev: React.DragEvent<HTMLDivElement>, index: number) => void;
}


const getSpanClass = (layout: LayoutSize) => {
    const layoutConfig = LAYOUTS[layout];
    const colSpan = `col-span-${layoutConfig.cols}`;
    const rowSpan = layoutConfig.rows > 1 ? ` row-span-${layoutConfig.rows}` : "";

    return `${colSpan}${rowSpan}`;
};


export function CardCanvas(props: CardCanvasProps) {
    const {
        stats,
        mediaType,
        timeframe,
        activeComps,
        statsLoading,
        showPreview,
        usedUnits,
        maxUnits,
        draggedIndex,
        dragOverIndex,
        onChangeLayout,
        onRemove,
        onEdit,
        onDragStart,
        onDragOver,
        onDragEnd,
        onTouchStart,
        onTouchMove,
        onTouchEnd,
    } = props;

    const accent = getAccentClasses(mediaType);

    const canSwitchToLayout = (currentLayout: LayoutSize, newLayout: LayoutSize) => {
        const currentUnits = LAYOUTS[currentLayout].units;
        const newUnits = LAYOUTS[newLayout].units;
        const unitDiff = newUnits - currentUnits;

        return usedUnits + unitDiff <= maxUnits;
    };

    return (
        <div className="grid auto-rows-[130px] grid-flow-dense grid-cols-4 gap-4 max-sm:gap-3">
            {activeComps.map((comp, idx) => {
                const compDef = COMPONENT_DEFS[comp.compId];
                const spanClass = getSpanClass(comp.layout);
                const isDragged = !showPreview && draggedIndex === idx;
                const isDragOver = !showPreview && dragOverIndex === idx;
                const isLoading = compDef.mode === "auto" && statsLoading;
                const hasMultipleLayouts = compDef.availableLayouts.length > 1;

                return (
                    <div
                        key={comp.instanceId}
                        data-card-index={idx}
                        onDragEnd={onDragEnd}
                        onTouchEnd={onTouchEnd}
                        draggable={!showPreview}
                        onTouchMove={onTouchMove}
                        onTouchStart={() => onTouchStart(idx)}
                        onDragOver={(ev) => onDragOver(ev, idx)}
                        onDragStart={(ev) => onDragStart(ev, idx)}
                        className={`
                            group relative overflow-hidden rounded-lg border bg-gray-800
                            ${spanClass}
                            ${isDragged ? "opacity-50" : ""}
                            ${isDragOver ? accent.border : "border-gray-700"}
                            ${!showPreview ? `hover:${accent.border} cursor-move transition-all` : ""}
                        `}
                    >
                        <StatBlock
                            stats={stats}
                            component={comp}
                            mediaType={mediaType}
                            timeframe={timeframe}
                            isLoading={isLoading}
                            onEdit={(slotIndex) => onEdit(comp.instanceId, slotIndex)}
                        />

                        {!showPreview &&
                            <div className="absolute right-2 top-2 z-10 flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                {hasMultipleLayouts &&
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button size="xs" variant="secondary" title="Change size">
                                                <Maximize2 className="size-3"/>
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            {compDef.availableLayouts.map((layout) => {
                                                const layoutConfig = LAYOUTS[layout];
                                                const isCurrentLayout = layout === comp.layout;
                                                const canSwitch = isCurrentLayout || canSwitchToLayout(comp.layout, layout);

                                                return (
                                                    <DropdownMenuItem
                                                        key={layout}
                                                        disabled={!canSwitch}
                                                        className={isCurrentLayout ? "bg-gray-700" : ""}
                                                        onClick={() => onChangeLayout(comp.instanceId, layout)}
                                                    >
                                                        <span>{layoutConfig.label}</span>
                                                        <span className="ml-auto text-xs text-gray-400">
                                                            {layoutConfig.cols}×{layoutConfig.rows}
                                                        </span>
                                                    </DropdownMenuItem>
                                                );
                                            })}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                }

                                {compDef.mode === "manual" && comp.manualData && comp.compId !== "mediaShowcase" &&
                                    <Button
                                        size="xs"
                                        title="Edit"
                                        variant="secondary"
                                        onClick={() => onEdit(comp.instanceId)}
                                    >
                                        <Pen className="size-3"/>
                                    </Button>
                                }

                                <Button
                                    size="xs"
                                    title="Remove"
                                    variant="destructive"
                                    onClick={() => onRemove(comp.instanceId)}
                                >
                                    <X className="size-3"/>
                                </Button>
                            </div>
                        }
                    </div>
                );
            })}

            {usedUnits < maxUnits && !showPreview &&
                <div
                    className="col-span-1 flex min-h-[120px] items-center
                    justify-center rounded-lg border-2 border-dashed border-gray-600 bg-gray-800/30"
                >
                    <span className="text-xs text-gray-500 md:text-sm">
                        Add component
                    </span>
                </div>
            }
        </div>
    );
}
