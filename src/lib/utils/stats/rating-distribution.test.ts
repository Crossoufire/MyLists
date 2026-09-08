import {describe, expect, it} from "vitest";
import {transformRatingToFeeling} from "./rating-distribution";


describe("rating distribution", () => {
    it("maps ratings by their score instead of their array position", () => {
        const result = transformRatingToFeeling([
            { name: "10.0", value: 2 },
            { name: "1.5", value: 3 },
            { name: "not-a-rating", value: 10 },
        ]);

        expect(result).toEqual([
            { name: 0, value: 0 },
            { name: 2, value: 3 },
            { name: 4, value: 0 },
            { name: 6, value: 0 },
            { name: 8, value: 0 },
            { name: 10, value: 2 },
        ]);
    });
});
