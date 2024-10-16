import { Resource, ResourceData } from './resource';

export type ResourceStore<
  T extends ResourceData,
  TCreate extends Record<string, any> = Partial<T>,
  TUpdate extends Record<string, any> = Partial<T>,
> = Resource<T, TCreate, TUpdate> & {
  data: T[];
  loaded: boolean;
  loading: boolean;
  refresh: () => void;
};
