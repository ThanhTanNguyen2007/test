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
    query: z.object({
      is_getting_all: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Is Getting All should be a number' })
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
      search: z.string().optional(),
    }),
  });
  return schema.parse(req);
};

export const getPhoneCert = (req: Request) => {
  const schema = z.object({
    params: z.object({
      phoneNumberId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};

export const getAllPhoneNumbersOfWaba = (req: Request) => {
  const schema = z.object({
    query: z.object({
      wabaId: z.string(),
    }),
  });
  return schema.parse(req);
};

export const getPhoneStatus = (req: Request) => {
  const schema = z.object({
    params: z.object({
      phoneNumberId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};
