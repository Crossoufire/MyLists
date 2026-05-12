import * as z from "zod";
import {searchTypeSchema} from "@/lib/schemas/common.schema";


export const allUpdatesHistorySchema = searchTypeSchema.extend({
    username: z.string(),
});
