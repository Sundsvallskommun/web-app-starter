import { AxiosResponse } from 'axios';
import { FieldPath } from 'react-hook-form';

import { Create, GetMany, GetOne, ID, Remove, Update } from './resource-services';
import { ServiceResponse } from './services';

export type ResourceResponse<T> = Promise<AxiosResponse<ServiceResponse<T>>>;
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type ResourceData = Record<string, any> & { id?: ID };

export interface Resource<
  T extends ResourceData,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TCreate extends Record<string, any> = Partial<T>,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  TUpdate extends Record<string, any> = Partial<T>,
> {
  name: string;
  getOne: GetOne<ResourceResponse<T>>;
  getMany: GetMany<ResourceResponse<T[]>>;
  create?: Create<TCreate, ResourceResponse<T>>;
  update?: Update<TUpdate, ResourceResponse<T>>;
  remove?: Remove;
  defaultValues?: TCreate;
  requiredFields?: FieldPath<TCreate & TUpdate>[];
}
