import {MediaType} from "@/lib/utils/enums";
import {useCallback, useMemo, useState} from "react";
import {MEDIA_CONFIGS} from "@/lib/client/social-card/media.config";
import {COMPONENT_DEFS} from "@/lib/client/social-card/components-registry";
import {ActiveComponent, CompId, FeaturedMediaData, LAYOUTS, LayoutSize, MediaShowcaseData, Timeframe} from "@/lib/client/social-card/types";


interface StatCardBuilderProps {
    maxUnits?: number;
    mediaType: MediaType;
}


export const useStatCardBuilder = ({ mediaType, maxUnits = 12 }: StatCardBuilderProps) => {
    const mediaConfig = MEDIA_CONFIGS[mediaType];
    const [showPreview, setShowPreview] = useState(false);
    const [activeComps, setActiveComps] = useState<ActiveComponent[]>([]);
    const [timeframe, setTimeframe] = useState<Timeframe>("year");

    const usedUnits = useMemo(() => activeComps.reduce(
        (sum, comp) => sum + LAYOUTS[comp.layout].units, 0), [activeComps]);

    const remainingUnits = maxUnits - usedUnits;

    const canAddComponent = useCallback((compId: CompId, layout?: LayoutSize) => {
        const compDef = COMPONENT_DEFS[compId];
        const chosenLayout = layout ?? compDef.defaultLayout;
        const layoutConfig = LAYOUTS[chosenLayout];

        if (compDef.supportedMedia !== "all") {
            if (!compDef.supportedMedia.includes(mediaType)) {
                return false;
            }
        }

        if (!mediaConfig.availableComps.includes(compId)) {
            return false;
        }

        if (usedUnits + layoutConfig.units > maxUnits) {
            return false;
        }

        if (compId === "yearInReview" && timeframe === "alltime") {
            return false;
        }

        return true;
    }, [mediaType, mediaConfig, usedUnits, maxUnits, timeframe]);

    const canAddLayout = useCallback((layout: LayoutSize) => {
        return usedUnits + LAYOUTS[layout].units <= maxUnits;
    }, [usedUnits, maxUnits]);

    const addComponent = useCallback((compId: CompId, layout?: LayoutSize) => {
        const def = COMPONENT_DEFS[compId];
        const chosenLayout = layout ?? def.defaultLayout;

        if (!canAddComponent(compId, chosenLayout)) return;

        let initialManualData: FeaturedMediaData | MediaShowcaseData | undefined;

        if (def.mode === "manual") {
            initialManualData = (compId === "mediaShowcase") ? [null, null, null, null] : null;
        }

        setActiveComps((prev) => [...prev, {
            compId,
            layout: chosenLayout,
            instanceId: Date.now(),
            manualData: initialManualData,
        }]);
    }, [canAddComponent]);

    const changeComponentLayout = useCallback((instanceId: number, newLayout: LayoutSize) => {
        setActiveComps((prev) => {
            const comp = prev.find((c) => c.instanceId === instanceId);
            if (!comp) return prev;

            const currentUnits = LAYOUTS[comp.layout].units;
            const newUnits = LAYOUTS[newLayout].units;
            const unitDiff = newUnits - currentUnits;

            if (usedUnits + unitDiff > maxUnits) {
                return prev;
            }

            return prev.map((c) => c.instanceId === instanceId ? { ...c, layout: newLayout } : c);
        });
    }, [usedUnits, maxUnits]);

    const removeComponent = useCallback((instanceId: number) => {
        setActiveComps((prev) => prev.filter((c) => c.instanceId !== instanceId));
    }, []);

    const updateManualData = useCallback((instanceId: number, data: FeaturedMediaData, slotIndex?: number) => {
        setActiveComps((prev) => prev.map((c) => {
            if (c.instanceId !== instanceId) return c;

            if (c.compId === "mediaShowcase" && slotIndex !== undefined) {
                const currentData = (c.manualData as MediaShowcaseData) ?? [null, null, null, null];
                const newData = [...currentData];
                newData[slotIndex] = data;
                return { ...c, manualData: newData };
            }

            return { ...c, manualData: data };
        }));
    }, []);

    const reorderComponents = useCallback((fromIndex: number, toIndex: number) => {
        setActiveComps((prev) => {
            const newComps = [...prev];
            const [moved] = newComps.splice(fromIndex, 1);
            newComps.splice(toIndex, 0, moved);

            return newComps;
        })
    }, []);

    const resetToDefault = useCallback(() => {
        setTimeframe("year");
        setActiveComps(mediaConfig.defaultLayout.map((item, idx) => {
                const def = COMPONENT_DEFS[item.compId];

                let initialManualData: FeaturedMediaData | MediaShowcaseData | undefined;
                if (def.mode === "manual") {
                    initialManualData = (item.compId === "mediaShowcase") ? [null, null, null, null] : null;
                }

                return {
                    compId: item.compId,
                    layout: item.layout,
                    instanceId: Date.now() + idx,
                    manualData: initialManualData,
                };
            })
        );
    }, [mediaConfig]);

    const handleTimeframeChange = useCallback((newTimeframe: Timeframe) => {
        setTimeframe(newTimeframe);
        if (newTimeframe === "alltime") {
            setActiveComps((prev) => prev.filter((c) => c.compId !== "yearInReview"));
        }
    }, []);

    const getCardConfig = useCallback(() => {
        return {
            mediaType,
            timeframe,
            components: activeComps,
        };
    }, [mediaType, timeframe, activeComps]);

    return {
        // State
        mediaConfig,
        timeframe,
        activeComps,
        showPreview,
        usedUnits,
        remainingUnits,
        maxUnits,

        // Actions
        setShowPreview,
        addComponent,
        removeComponent,
        changeComponentLayout,
        updateManualData,
        reorderComponents,
        resetToDefault,
        setTimeframe: handleTimeframeChange,
        canAddComponent,
        canAddLayout,
        getCardConfig,
    };
};
