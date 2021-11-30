import { Request} from 'express';

export type SanitizedUser = {
  id: number;
  email: string;
  isAdmin: boolean;
  partner: { id: number; timezone: string } | null;
  status: UserStatus;
};

export interface RequestWithUserInfo extends Request {
  user: SanitizedUser;
}

export type UserStatus = "NotInitiated" | "Initiated" | "Completed";

export enum UserStatusEnum {
  NotInitiated = "NotInitiated",
  Initiated = "Initiated",
  Completed = "Completed",
}

export const apiPaths = ['/api', '/api-docs', '/partnerApi', '/webhooks'];