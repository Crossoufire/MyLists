import type {CompactedHistogramBin, HistogramBin, HistogramTailDir, NamedValue} from "@/lib/types/stats.types";


const formatBucketBoundary = (value: number) => {
    return Number.isInteger(value) ? value.toString() : value.toFixed(1);
};


const mergeHistogramBins = (bins: HistogramBin[]) => {
    return {
        start: bins[0].start,
        endExclusive: bins[bins.length - 1].endExclusive,
        value: bins.reduce((sum, bin) => sum + bin.value, 0),
    };
}


export const toHistogramBins = (points: NamedValue[], getEndExclusive: (start: number) => number): HistogramBin[] => {
    return points.flatMap(({ name, value }) => {
        const start = Number(name);
        const endExclusive = getEndExclusive(start);

        if (!Number.isFinite(start) || !Number.isFinite(endExclusive) || endExclusive <= start) {
            return [];
        }

        return [{ start, value, endExclusive }];
    });
};


export const formatHistogramBin = (bin: HistogramBin, unit?: string, rangeMode: "continuous" | "integer" = "integer") => {
    const suffix = unit ? ` ${unit}` : "";

    if (bin.endExclusive === null) {
        return `${formatBucketBoundary(bin.start)}+${suffix}`;
    }

    if (rangeMode === "continuous") {
        return `${formatBucketBoundary(bin.start)}–${formatBucketBoundary(bin.endExclusive)}${suffix}`;
    }

    const inclusiveEnd = bin.endExclusive - 1;
    if (inclusiveEnd === bin.start) {
        return `${formatBucketBoundary(bin.start)}${suffix}`;
    }

    return `${formatBucketBoundary(bin.start)}–${formatBucketBoundary(inclusiveEnd)}${suffix}`;
};


export const formatHistogramOverflowBin = (bin: HistogramBin, direction: HistogramTailDir, unit?: string) => {
    const suffix = unit ? ` ${unit}` : "";

    return direction === "lower"
        ? `Before ${formatBucketBoundary(bin.endExclusive as number)}${suffix}`
        : `${formatBucketBoundary(bin.start)}+${suffix}`;
};


interface CompactHistogramParams {
    maxBins?: number;
    percentile?: number;
    tailDirection?: HistogramTailDir;
}


export const compactHistogramBins = (bins: HistogramBin[], { maxBins = 12, percentile = 0.95, tailDirection = "upper" }: CompactHistogramParams = {}) => {
    const sortedBins = [...bins].sort((a, b) => a.start - b.start);
    if (sortedBins.length <= maxBins) {
        return sortedBins.map((bin) => ({ bin, overflow: null, sourceBinCount: 1 }));
    }

    const total = sortedBins.reduce((sum, bin) => sum + bin.value, 0);
    const isUpperTail = tailDirection === "upper";
    const percentileTarget = total * (isUpperTail ? percentile : 1 - percentile);

    let cumulative = 0;
    const percentileIndex = sortedBins.findIndex((bin) => {
        cumulative += bin.value;
        return cumulative >= percentileTarget;
    });

    const regularBins = isUpperTail
        ? sortedBins.slice(0, percentileIndex + 1)
        : sortedBins.slice(percentileIndex);

    const tailBins = isUpperTail
        ? sortedBins.slice(percentileIndex + 1)
        : sortedBins.slice(0, percentileIndex);

    const overflowBin: CompactedHistogramBin | null = tailBins.length > 0
        ? {
            overflow: tailDirection,
            sourceBinCount: tailBins.length,
            bin: mergeHistogramBins(tailBins),
        }
        : null;

    const compactedRegularBins: CompactedHistogramBin[] = [];
    const availableRegularBins = maxBins - (overflowBin ? 1 : 0);
    const groupSize = Math.ceil(regularBins.length / availableRegularBins);

    for (let idx = 0; idx < regularBins.length; idx += groupSize) {
        const groupedBins = regularBins.slice(idx, idx + groupSize);
        compactedRegularBins.push({
            overflow: null,
            sourceBinCount: groupedBins.length,
            bin: mergeHistogramBins(groupedBins),
        });
    }

    if (!overflowBin) {
        return compactedRegularBins;
    }

    return overflowBin.overflow === "lower"
        ? [overflowBin, ...compactedRegularBins]
        : [...compactedRegularBins, overflowBin];
};
