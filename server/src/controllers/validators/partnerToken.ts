import { Request } from 'express';
import * as z from 'zod';

// Remember to catch and send errors at the end of the controller
// } catch (err) {
//   if (err instanceof z.ZodError) {
//     return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
//   }
// }

export const find = (req: Request) => {
  const schema = z.object({
    params: z.object({
      partnerId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};

export const create = (req: Request) => {
  const schema = z.object({
    params: z.object({
      partnerId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};

export const revoke = (req: Request) => {
  const schema = z.object({
    params: z.object({
      partnerKeyId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'partnerKeyId should be a number' }),
    }),
  });
  return schema.parse(req);
};
