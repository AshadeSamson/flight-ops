import { z } from 'zod';

const staffIdSchema = z
  .string()
  .trim()
  .transform((val) => (val === "" ? undefined : val))
  .refine(
    (val) => {
      if (!val) return true; // skip if undefined
      return /^BASL\/ID\/\d{8,10}$/.test(val.toUpperCase());
    },
    {
      message:
        "Invalid staff ID",
    }
  )
  .optional();


export const registerSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(3),
  staffId: staffIdSchema,
});

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6),
});