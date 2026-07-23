import { dateFields } from '@config/defaults';
import dayjs from 'dayjs';

type GetFormattedFields = (
  object: Record<string | number, unknown>,
  deep?: boolean
) => Record<string | number, unknown>;

export const getFormattedFields: GetFormattedFields = (object, deep) => {
  return Object.keys(object).reduce<Record<string | number, unknown>>((newObject, key) => {
    const value = object[key];
    if (typeof value === 'object' && value !== null) {
      return {
        ...newObject,
        [key]: deep ? getFormattedFields(value as Record<string | number, unknown>, true) : value,
      };
    }
    if (dateFields.includes(key)) {
      const date = dayjs(new Date(value as string | number)).format('YYYY-MM-DD, H:mm');
      return { ...newObject, [key]: date };
    }
    return { ...newObject, [key]: value };
  }, {});
};
