import {cn} from "@/lib/utils/helpers";
import {ChevronDown} from "lucide-react";
import {MediaType} from "@/lib/utils/enums";
import {Badge} from "@/lib/client/components/ui/badge";
import {Button} from "@/lib/client/components/ui/button";
import {Card, CardContent} from "@/lib/client/components/ui/card";
import {COMPONENT_DEFS} from "@/lib/client/social-card/components-registry";
import {Timeframe, CompId, LayoutSize, LAYOUTS} from "@/lib/client/social-card/types";
import {getAccentClasses, MEDIA_CONFIGS} from "@/lib/client/social-card/media.config";
import {DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger} from "../ui/dropdown-menu";


interface ComponentPaletteProps {
    maxUnits: number;
    usedUnits: number;
    mediaType: MediaType;
    timeframe: Timeframe;
    canAddLayout: (layout: LayoutSize) => boolean;
    onAddComponent: (compId: CompId, layout?: LayoutSize) => void;
    canAddComponent: (compId: CompId, layout?: LayoutSize) => boolean;
}


export function ComponentPalette(props: ComponentPaletteProps) {
    const { mediaType, usedUnits, maxUnits, timeframe, onAddComponent, canAddComponent, canAddLayout } = props;

    const accent = getAccentClasses(mediaType);
    const mediaConfig = MEDIA_CONFIGS[mediaType];
    const availableComps = mediaConfig.availableComps.map((id) => COMPONENT_DEFS[id]);

    return (
        <Card>
            <CardContent>
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-bold">
                        Components
                    </h2>
                    <Badge variant="outline" className={cn("border", accent.border, accent.text)}>
                        {usedUnits}/{maxUnits} units
                    </Badge>
                </div>

                <div className="space-y-2">
                    {availableComps.map((comp) => {
                        const Icon = comp.icon;
                        const canAddDefault = canAddComponent(comp.id);
                        const hasMultipleLayouts = comp.availableLayouts.length > 1;
                        const displayName = comp.getDisplayName?.(mediaConfig) ?? comp.name;
                        const isYearOnly = (comp.id === "yearInReview") && timeframe === "alltime";

                        if (!hasMultipleLayouts) {
                            const layout = comp.availableLayouts[0];
                            const layoutConfig = LAYOUTS[layout];

                            return (
                                <Button
                                    key={comp.id}
                                    variant="outline"
                                    disabled={!canAddDefault}
                                    onClick={() => onAddComponent(comp.id, layout)}
                                    className="w-full justify-between border-gray-600 hover:border-gray-500
                                    hover:bg-gray-700 disabled:opacity-60"
                                >
                                    <div className="flex items-center gap-2">
                                        <Icon className="size-4"/>
                                        <span className="text-sm">
                                            {displayName}
                                        </span>
                                        {comp.mode === "manual" &&
                                            <Badge variant="secondary" className="text-xs">
                                                Manual
                                            </Badge>
                                        }
                                        {isYearOnly &&
                                            <Badge variant="secondary" className="bg-gray-700 text-xs">
                                                Year only
                                            </Badge>
                                        }
                                    </div>
                                    <Badge variant="secondary" className="w-10 bg-gray-700">
                                        {comp.defaultLayout}
                                    </Badge>
                                </Button>
                            );
                        }

                        return (
                            <DropdownMenu key={comp.id}>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        disabled={!canAddDefault && !comp.availableLayouts.some((l) => canAddLayout(l))}
                                        className="w-full justify-between border-gray-600 hover:border-gray-500
                                        hover:bg-gray-700 disabled:opacity-60"
                                    >
                                        <div className="flex items-center gap-2">
                                            <Icon className="size-4"/>
                                            <span className="text-sm">
                                                {displayName}
                                            </span>
                                            {comp.mode === "manual" &&
                                                <Badge variant="secondary" className="text-xs">
                                                    Manual
                                                </Badge>
                                            }
                                            {isYearOnly &&
                                                <Badge variant="secondary" className="bg-gray-700 text-xs">
                                                    Year only
                                                </Badge>
                                            }
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <ChevronDown className="size-4 text-gray-400"/>
                                        </div>
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-48">
                                    {comp.availableLayouts.map((layout) => {
                                        const layoutConfig = LAYOUTS[layout];
                                        const canAdd = canAddComponent(comp.id, layout);

                                        return (
                                            <DropdownMenuItem
                                                key={layout}
                                                disabled={!canAdd}
                                                className="flex justify-between"
                                                onClick={() => onAddComponent(comp.id, layout)}
                                            >
                                                <span>{layoutConfig.label}</span>
                                                <span className="text-xs text-gray-400">
                                                    {layoutConfig.cols}×{layoutConfig.rows} ({layoutConfig.units}u)
                                                </span>
                                            </DropdownMenuItem>
                                        );
                                    })}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        );
                    })}
                </div>
            </CardContent>
        </Card>
    );
}
