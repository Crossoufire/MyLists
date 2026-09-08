import type * as z from "zod";
import type {MediaType} from "@/lib/utils/enums";
import {editMediaDetailsPayloadSchemas, type MediaEditFieldByType} from "@/lib/schemas/media-details.schema";


export function createMediaEditPayloadSchema<T extends MediaType>(mediaType: T, editableFields: readonly MediaEditFieldByType[T][]) {
    const schema: z.ZodObject<z.ZodRawShape> = editMediaDetailsPayloadSchemas[mediaType];
    const mask = Object.fromEntries(editableFields.map(field => [field, true])) as Record<string, true>;

    // Selected fields are dynamic; all catalog fields are optional in payload type
    return schema.pick(mask) as (typeof editMediaDetailsPayloadSchemas)[T];
}
