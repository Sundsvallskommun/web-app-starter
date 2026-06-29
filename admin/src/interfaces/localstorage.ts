import { ColorSchemeMode } from '@sk-web-gui/react';

import { ResourceName } from './resource-name';

type Headers = Partial<Record<ResourceName, string[]>>;

interface DataStorage {
  data?: Record<string, unknown>[];
  loaded: boolean;
  loading: boolean;
}

type ResourceData = Partial<Record<ResourceName, DataStorage>>;

export interface LocalStorage {
  colorScheme: ColorSchemeMode;
  setColorScheme: (color: ColorSchemeMode) => void;
  headers: Headers;
  setHeaders: (headers: Headers) => void;
  resourceData: ResourceData;
  setData: (resource: ResourceName, data: Record<string, unknown>[]) => void;
  setLoaded: (resource: ResourceName, loaded: boolean) => void;
  setLoading: (resource: ResourceName, loading: boolean) => void;
}
