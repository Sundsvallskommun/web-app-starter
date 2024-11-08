import { ApiResponse, apiService } from '../api-service';
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { __DEV__ } from '@sk-web-gui/react';
import { emptyUser } from './defaults';
import { ServiceResponse } from '@interfaces/services';
import { ClientUser } from '@data-contracts/backend/data-contracts';

const handleSetUserResponse: (res: ApiResponse<ClientUser>) => ClientUser = (res) => ({
  name: res.data.name,
  username: res.data.username,
  // permissions: res.data.permissions,
});

const getMe: () => Promise<ServiceResponse<ClientUser>> = () => {
  return apiService
    .get<ApiResponse<ClientUser>>('me')
    .then((res) => ({ data: handleSetUserResponse(res.data) }))
    .catch((e) => ({
      message: e.response?.data.message,
      error: e.response?.status ?? 'UNKNOWN ERROR',
    }));
};

interface State {
  user: ClientUser;
}
interface Actions {
  setUser: (user: ClientUser) => void;
  getMe: () => Promise<ServiceResponse<ClientUser>>;
  reset: () => void;
}

const initialState: State = {
  user: emptyUser,
};

export const useUserStore = create<State & Actions>()(
  devtools(
    (set, get) => ({
      ...initialState,
      setUser: (user) => set(() => ({ user })),
      getMe: async () => {
        let user = get().user;
        const res = await getMe();
        if (!res.error) {
          user = res.data;
          set(() => ({ user: user }));
        }
        return { data: user };
      },
      reset: () => {
        set(initialState);
      },
    }),
    { enabled: __DEV__ }
  )
);
