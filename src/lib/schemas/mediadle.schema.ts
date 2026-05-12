import * as z from "zod";


export const mediadleSuggestionsSchema = z.object({
    query: z.string(),
});

export const addMediadleGuessSchema = z.object({
    guess: z.string(),
});
