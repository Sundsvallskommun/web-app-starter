import { Api } from '@data-contracts/backend/Api';
import { User } from '@data-contracts/backend/data-contracts';
import { Resource } from '@interfaces/resource';

const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

const users: Resource<User> = {
  name: 'users',
  getOne: apiService.userControllerGetUser,
  getMany: apiService.userControllerGetUsers,
  defaultValues: {
    name: '',
  },
  requiredFields: ['name'],
};

const resources = { users };

export default resources;
