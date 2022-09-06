import { Request } from 'express';
import { User } from '@interfaces/users.interface';

export interface DataStoredInToken {
  id: number;
}

export interface TokenData {
  token: string;
  expiresIn: number;
}

// export interface Representing {
//   organizationName: string;
//   organizationNumber: string;
//   organizationId: string;
// }

export interface RequestWithUser extends Request {
  user: User;
  // representing?: Representing;
}
