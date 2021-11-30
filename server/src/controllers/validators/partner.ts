import { Request } from 'express';
import * as z from 'zod';
import { checkValidTimezone } from './helpers';

// Remember to catch and send errors at the end of the controller
// } catch (err) {
//   if (err instanceof z.ZodError) {
//     return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
//   }
// }

export const get = (req: Request) => {
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
    body: z.object({
      userId: z.number(),
      timezone: z.string().refine(checkValidTimezone, { message: 'Invalid timezone chosen' }),
    }),
  });
  return schema.parse(req);
};

export const update = (req: Request) => {
  const schema = z.object({
    params: z.object({
      partnerId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
    body: z.object({ timezone: z.string().optional() }),
  });
  return schema.parse(req);
};

export const changeActivation = (req: Request) => {
  const schema = z.object({
    params: z.object({
      partnerId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
    body: z.object({ isActivated: z.boolean() }),
  });
  return schema.parse(req);
}
