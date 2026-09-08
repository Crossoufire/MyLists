import {describe, expect, it} from "vitest";
import {MediaType, Status} from "@/lib/utils/enums";
import {ALL_MEDIA_TYPES, getMediaDefinition} from "./definition.registry";
import {importStatusSchema} from "@/lib/server/domain/imports/import-list-validation";


describe("shared media status policy", () => {
    it.each([
        [MediaType.SERIES, [Status.WATCHING, Status.COMPLETED, Status.ON_HOLD, Status.RANDOM, Status.DROPPED, Status.PLAN_TO_WATCH]],
        [MediaType.ANIME, [Status.WATCHING, Status.COMPLETED, Status.ON_HOLD, Status.RANDOM, Status.DROPPED, Status.PLAN_TO_WATCH]],
        [MediaType.MOVIES, [Status.COMPLETED, Status.PLAN_TO_WATCH]],
        [MediaType.BOOKS, [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ]],
        [MediaType.GAMES, [Status.PLAYING, Status.COMPLETED, Status.ENDLESS, Status.MULTIPLAYER, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_PLAY]],
        [MediaType.MANGA, [Status.READING, Status.COMPLETED, Status.ON_HOLD, Status.DROPPED, Status.PLAN_TO_READ]],
    ])("preserves status choices, order and backend validation for %s", (mediaType, expectedStatuses) => {
        expect(getMediaDefinition(mediaType).statuses).toEqual(expectedStatuses);
        const validator = importStatusSchema(mediaType);
        for (const status of Object.values(Status)) {
            expect(validator.safeParse(status).success).toBe(expectedStatuses.some(expected => expected === status));
        }
    });

    it("preserves the media display order and includes every registered type once", () => {
        expect(ALL_MEDIA_TYPES).toEqual([MediaType.SERIES, MediaType.ANIME, MediaType.MOVIES, MediaType.BOOKS, MediaType.GAMES, MediaType.MANGA]);
        expect([...ALL_MEDIA_TYPES].sort()).toEqual(Object.values(MediaType).sort());
        for (const mediaType of ALL_MEDIA_TYPES) expect(getMediaDefinition(mediaType).identity.mediaType).toBe(mediaType);
    });
});
