import { z } from "zod";

export const messageSchema = z.object({
  content: z
    .string()
    .min(10, { message: "content must be of an atleast 10 characters" })
    .max(300, "content must be no longer than 300 characters"),
});
