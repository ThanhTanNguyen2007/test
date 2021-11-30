import { Request } from 'express';
import * as z from 'zod';

export const find = (req: Request) => {
    const schema = z.object({
      query: z.object({
        'wabaIds': z
          .string()
          .optional(),
        'phoneNumbers': z
          .string()
          .optional(),
        'page': z
          .string()
          .transform((arg) => Number(arg))
          .refine((val) => !isNaN(val), { message: 'Page should be a number' })
          .optional(),
        'size': z
          .string()
          .transform((arg) => Number(arg))
          .refine((val) => !isNaN(val), { message: 'Size should be a number' })
          .optional(),
      }),
    });
    return schema.parse(req);
};