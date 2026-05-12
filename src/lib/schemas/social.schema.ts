import * as z from "zod";


export const respondToFollowRequest = z.object({
    action: z.enum(["accept", "decline"]),
    followerId: z.coerce.number().int().positive(),
});
