import { ResourceResponse } from '@interfaces/resource';
import { useSnackbar } from '@sk-web-gui/react';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

export const useCrudHelper = (resource) => {
  const message = useSnackbar();
  const { t } = useTranslation();

  const handleGetOne = async (getOne: () => ResourceResponse<any>) => {
    const name = t(`${resource}:name_one`);
    try {
      const result = await getOne();
      return Promise.resolve(result.data.data);
    } catch {
      message({ message: capitalize(t('crud:get_one.error', { resource: name })), status: 'error' });
    }
  };

  const handleGetMany = async (getMany: () => ResourceResponse<any[]>): Promise<any[]> => {
    const name = t(`${resource}:name_many`);
    try {
      const result = await getMany();
      return Promise.resolve(result.data.data);
    } catch {
      message({ message: capitalize(t('crud:get_one.error', { resource: name })), status: 'error' });
    }
  };

  const handleCreate = async (create: () => ResourceResponse<any>) => {
    const name = t(`${resource}:name_one`);
    try {
      const result = await create();
      if (result) {
        message({ message: capitalize(t('crud:create.success', { resource: name })), status: 'success' });
        return Promise.resolve(result.data.data);
      }
    } catch {
      message({ message: t('crud:create.error', { resource: name }), status: 'error' });
    }
  };

  const handleUpdate = async (update: () => ResourceResponse<any>) => {
    const name = t(`${resource}:name_one`);
    try {
      const result = await update();
      if (result) {
        message({ message: capitalize(t('crud:update.success', { resource: name })), status: 'success' });
        return Promise.resolve(result.data.data);
      }
    } catch {
      message({ message: capitalize(t('crud:update.error', { resource: name })), status: 'error' });
    }
  };

  const handleRemove = async (remove: () => ResourceResponse<any>): Promise<any> => {
    const name = t(`${resource}:name_one`);
    try {
      const result = await remove();
      if (result) {
        message({ message: capitalize(t('crud:remove.success', { resource: name })), status: 'success' });
        return Promise.resolve(result.data.data);
      }
    } catch {
      message({ message: capitalize(t('crud:remove.error', { resource: name })), status: 'error' });
    }
  };

  return { handleGetOne, handleGetMany, handleCreate, handleUpdate, handleRemove };
};
