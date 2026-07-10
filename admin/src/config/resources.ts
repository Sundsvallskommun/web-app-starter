import { Api } from '@data-contracts/backend/Api';
import { User } from '@data-contracts/backend/data-contracts';
import { Resource } from '@interfaces/resource';

const apiService = new Api({ baseURL: process.env.NEXT_PUBLIC_API_URL, withCredentials: true });

// The starter backend only exposes GET /me (userControllerGetUser). The remaining CRUD
// endpoints are typed stubs — wire each to a real Api method as you build them out.
const notImplemented = (endpoint: string) => (): never => {
  throw new Error(`${endpoint} is not implemented — connect it to a real Api method.`);
};

const users: Resource<User> = {
  name: 'users',
  // The generated client's response shape differs from the generic Resource contract; bridge it here.
  getOne: apiService.userControllerGetUser as unknown as Resource<User>['getOne'],
  getMany: notImplemented('users.getMany'),
  create: notImplemented('users.create'),
  update: notImplemented('users.update'),
  remove: notImplemented('users.remove'),
  defaultValues: {
    name: '',
  },
  requiredFields: ['name'],
};

const resources = { users };

export default resources;
