import { Request } from 'express';
import * as z from 'zod';

// Remember to catch and send errors at the end of the controller
// } catch (err) {
//   if (err instanceof z.ZodError) {
//     return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
//   }
// }

export const connect = (req: Request) => {
  const schema = z.object({
    body: z.object({
      oauthToken: z.string(),
      partnerToken: z.string().optional(),
    }),
  });
  return schema.parse(req);
};

export const connectWithCustomerId = (req: Request) => {
  const schema = z.object({
    body: z.object({
      oauthToken: z.string(),
      partnerToken: z.string(),
      customerId: z.string(),
    }),
  });
  return schema.parse(req);
};

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

export const get = (req: Request) => {
  const schema = z.object({
    params: z.object({
      accountId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};

export const remove = (req: Request) => {
  const schema = z.object({
    params: z.object({
      accountId: z
        .string()
        .transform((arg) => Number(arg))
        .refine((val) => !isNaN(val), { message: 'Input should be a number' }),
    }),
  });
  return schema.parse(req);
};

export const enableCreditLine = (req: Request) => {
  const schema = z.object({
    params: z.object({
      wabaId: z.string(),
    }),
  });
  return schema.parse(req);
};

export const disableCreditLine = (req: Request) => {
  const schema = z.object({
    params: z.object({
      wabaId: z.string(),
    }),
  });
  return schema.parse(req);
};

export const getWABAStatus = (req: Request) => {
  const schema = z.object({
    params: z.object({
      wabaId: z.string(),
    }),
  });
  return schema.parse(req);
};

export const getTemplateToken = (req: Request) => {
  const schema = z.object({
    params: z.object({
      wabaId: z.string(),
    }),
  });
  return schema.parse(req);
};

export const userWithCustomerIdCanceledFacebookFlow = (req: Request) => {
  const schema = z.object({
    body: z.object({
      partnerToken: z.string().optional(),
      customerId: z.string(),
    }),
  });
  return schema.parse(req);
};

export const reload = (req: Request) => {
  const schema = z.object({
    params: z.object({
      wabaId: z.string(),
    }),
  });
  return schema.parse(req);
};
