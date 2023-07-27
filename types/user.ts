import {z} from "zod";

export const userValidation = z
    .object({
        id: z.string(),
        name: z.string().min(1).max(256),
        icon: z.string().emoji(),
    })
export type User = z.infer<typeof userValidation>;