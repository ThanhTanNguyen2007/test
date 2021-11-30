import { Request } from 'express';
import * as z from 'zod';

// Remember to catch and send errors at the end of the controller
// } catch (err) {
//   if (err instanceof z.ZodError) {
//     return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
//   }
// }

export const me = (req: Request) => {
  const schema = z.object({
    cookies: z.object({
      email: z.string().optional(),
      token: z.string().optional(),
    }),
  });
  return schema.parse(req);
};

export const get = (req: Request) => {
  const schema = z.object({
    params: z.object({
      userId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};

export const update = (req: Request) => {
  const schema = z.object({
    params: z.object({
      userId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
    body: z.object({ isAdmin: z.boolean().optional() }),
  });
  return schema.parse(req);
};

export const getCustomerId = (req: Request) => {
  const schema = z.object({
    query: z.object({
      email: z.string(),
    }),
  });
  return schema.parse(req);
};

export const find = (req: Request) => {
  const schema = z.object({
    query: z.object({
      search: z
      .string()
      .optional(),
      page: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Page should be a number' })
        .optional(),
      size: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Size should be a number' })
        .optional(),
    }),
  });
  return schema.parse(req);
};
