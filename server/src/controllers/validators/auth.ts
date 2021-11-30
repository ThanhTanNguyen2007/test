import { Request } from 'express';
import * as z from 'zod';

// Remember to catch and send errors at the end of the controller
// } catch (err) {
//   if (err instanceof z.ZodError) {
//     return res.status(StatusCodes.BAD_REQUEST).send(err.errors);
//   }
// }

export const login = (req: Request) => {
  const schema = z.object({
    body: z.object({
      code: z.string(),
    }),
  });
  return schema.parse(req);
};

export const logout = (req: Request) => {
  const schema = z.object({
    cookies: z.object({
      token: z.string(),
    }),
  });
  return schema.parse(req);
};
