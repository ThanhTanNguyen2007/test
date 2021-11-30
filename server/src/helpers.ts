import { Request, Response, NextFunction } from 'express';
import { apiPaths } from './types';

export const setCookie = (key: string, value: string, maxAgeMilliseconds: number, res: Response) => {
  res.cookie(key, value, {
    path: '/',
    maxAge: maxAgeMilliseconds,
    sameSite: 'none',
    // You can't access these tokens in the client's javascript
    httpOnly: true,
    // Forces to use https in production
    secure: true,
  });
};

// void type is required for Proxy middleware
type Middleware = (req: Request, res: Response, next: NextFunction) => void | Promise<void | Response>;
export const unlessStartsWith = (paths: string[], middleware: Middleware) => {
  return function (req: Request, res: Response, next: NextFunction) {
    if (isReqPathInApiPaths(req)) {
      return next();
    } else {
      return middleware(req, res, next);
    }
  };
};

export const isReqPathInApiPaths = (req: Request) => {
  return apiPaths.filter((path: string) => req.path.startsWith(path)).length !== 0
}