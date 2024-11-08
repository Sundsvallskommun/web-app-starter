import { ClientUser } from '@data-contracts/backend/data-contracts';
import { ApiResponse } from '@services/api-service';

// export const defaultPermissions: Permissions = {
//     canEditSystemMessages: false,
// };

export const emptyUser: ClientUser = {
  name: '',
  username: '',
  //   permissions: defaultPermissions,
};

export const emptyUserResponse: ApiResponse<ClientUser> = {
  data: emptyUser,
  message: 'none',
};
