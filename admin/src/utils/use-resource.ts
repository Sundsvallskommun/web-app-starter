import 'dotenv';

import resources from '@config/resources';
import { ResourceName } from '@interfaces/resource-name';
import { useCallback, useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';

import { useCrudHelper } from './use-crud-helpers';
import { useLocalStorage } from './use-localstorage.hook';

const toResourceRows = (rows: object[]): Record<string, unknown>[] => rows.map((row) => ({ ...row }));

export const useResource = (resource: ResourceName) => {
  const [resourceData, setData, setLoaded, setLoading] = useLocalStorage(
    useShallow((state) => [state.resourceData, state.setData, state.setLoaded, state.setLoading])
  );

  const getMany = resources?.[resource]?.getMany;
  const { handleGetMany } = useCrudHelper(resource);

  const data = resourceData[resource]?.data ?? [];
  const loaded = resourceData[resource]?.loaded ?? false;
  const loading = resourceData[resource]?.loading ?? false;

  const refresh = useCallback(() => {
    if (getMany) {
      setLoading(resource, true);
      handleGetMany(getMany)
        .then((res) => {
          if (res) {
            setData(resource, toResourceRows(res));
            setLoaded(resource, true);
          }
          setLoading(resource, false);
        })
        .catch(() => {
          setLoading(resource, false);
        });
    }
  }, [resource]);

  useEffect(() => {
    if (!loaded || !resourceData) {
      refresh();
    }
  }, [resource]);

  return { data, loaded, loading, refresh };
};
