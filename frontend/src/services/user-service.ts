import { User } from 'src/interfaces/user';
import { ApiResponse, apiService } from './api-service';

export const emptyUser: User = {
  name: '',
};

const emptyUserResponse: ApiResponse<User> = {
  data: emptyUser,
  message: 'none',
};

const handleSetUserResponse: (res: ApiResponse<User>) => User = (res) => ({
  name: res.data.name,
});

export const getMe: () => Promise<User> = () => {
  return apiService.get<ApiResponse<User>>('me').then((res) => handleSetUserResponse(res.data));
};
