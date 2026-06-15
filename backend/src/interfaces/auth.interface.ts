import { User } from '@interfaces/users.interface';
import { Request } from 'express';

export interface RequestWithUser extends Request {
  user: User;
}

/** @public Permission flags resolved from a user's role. */
export interface Permissions {
  canEditSystemMessages: boolean;
}

/** @public AD (Active Directory) group roles. */
export type ADRole = 'sg_appl_app_admin' | 'sg_appl_app_read';

/** @public Internal application roles. */
export type InternalRole = 'app_admin' | 'app_read';

/** @public */
export enum InternalRoleEnum {
  'app_read',
  'app_admin',
}
