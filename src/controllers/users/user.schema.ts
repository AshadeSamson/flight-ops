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


export const createUserSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
  name: z.string().min(3),
  role: z.enum(["ADMIN", "SAFETY_ADMIN", "SAFETY_STAFF", "STAFF", "TENANT"]),
  staffId: staffIdSchema,
});

export const updateUserSchema = z.object({
  email: z.email().optional(),
  password: z.string().min(8).optional(),
  name: z.string().min(3).optional(),
  role: z.enum(["ADMIN", "SAFETY_ADMIN", "SAFETY_STAFF","STAFF", "TENANT"]).optional(),
  staffId: staffIdSchema,
});