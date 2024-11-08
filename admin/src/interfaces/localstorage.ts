import { ColorSchemeMode } from '@sk-web-gui/react';
import { ResourceName } from './resource-name';

export type TableProperty = string;

export type Headers = Partial<Record<ResourceName, Array<TableProperty>>>;

export interface DataStorage {
  data?: any[];
  loaded: boolean;
  loading: boolean;
}

export type ResourceData = Partial<Record<ResourceName, DataStorage>>;

export interface LocalStorage {
  colorScheme: ColorSchemeMode;
  setColorScheme: (color: ColorSchemeMode) => void;
  headers: Headers;
  setHeaders: (headers: Headers) => void;
  resourceData: ResourceData;
  setData: (resource: ResourceName, data: any[]) => void;
  setLoaded: (resource: ResourceName, loaded: boolean) => void;
  setLoading: (resource: ResourceName, loading: boolean) => void;
}
