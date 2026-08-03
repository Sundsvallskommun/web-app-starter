import { AxiosResponse } from 'axios';
import { FieldPath, FieldValues } from 'react-hook-form';

import { Create, GetMany, GetOne, ID, Remove, Update } from './resource-services';
import { ServiceResponse } from './services';

export type ResourceResponse<T> = Promise<AxiosResponse<ServiceResponse<T>>>;
type ResourceData = FieldValues & { id?: ID };

export interface Resource<
  T extends ResourceData,
  TCreate extends FieldValues = Partial<T>,
  TUpdate extends FieldValues = Partial<T>,
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
