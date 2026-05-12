import * as z from "zod";
import {MediaType} from "@/lib/utils/enums";


export const platformStatsSchema = z.object({
    mediaType: z.enum(MediaType).optional(),
});
