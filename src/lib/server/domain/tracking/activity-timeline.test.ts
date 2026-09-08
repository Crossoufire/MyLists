import {describe, expect, it} from "vitest";
import {MediaType} from "@/lib/utils/enums";
import {fillMonthlyActivityTimeline} from "./activity-timeline";


describe("activity timeline", () => {
    it("fills every month in the requested activity range, including trailing inactivity", () => {
        expect(fillMonthlyActivityTimeline({
            startMonth: "2026-01",
            endMonth: "2026-03",
            mediaTypes: [MediaType.BOOKS],
            data: [
                { month: "2026-01", total: 2, books: 2 },
            ],
        })).toEqual([
            { month: "2026-01", total: 2, books: 2 },
            { month: "2026-02", total: 0, books: 0 },
            { month: "2026-03", total: 0, books: 0 },
        ]);
    });
});
