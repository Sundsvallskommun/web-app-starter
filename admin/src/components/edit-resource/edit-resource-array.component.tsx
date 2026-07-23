import resources from '@config/resources';
import { Resource } from '@interfaces/resource';
import { ResourceName } from '@interfaces/resource-name';
import { Button, cx, FormControl, FormErrorMessage, FormLabel, Input } from '@sk-web-gui/react';
import { fieldpathWithoutIndex } from '@utils/fieldpath-without-index';
import { Minus, Plus } from 'lucide-react';
import { useEffect } from 'react';
import { FieldError, FieldErrorsImpl, FieldValues, Merge, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

import { EditResourceObject } from './edit-resource-object.component';

interface EditResourceArrayProps {
  property: string;
  resource: ResourceName;
  parents?: string;
  level?: number;
}

export const EditResourceArray: React.FC<EditResourceArrayProps> = ({
  property,
  resource,
  parents,
  level: _level = 2,
}) => {
  const { defaultValues, requiredFields } = resources[resource];
  const level = _level > 6 ? 6 : _level;

  const { t } = useTranslation();

  type DataType = Parameters<NonNullable<Resource<FieldValues>['create']>>[0];

  const dataTypeKey = parents ? `${parents}.${property}` : property;
  const i18nKey = fieldpathWithoutIndex(dataTypeKey) as string;

  const {
    register,
    watch,
    setValue,
    setError,
    clearErrors,
    formState: { errors },
  } = useFormContext<DataType>();

  const formdata = watch(dataTypeKey) as DataType;

  const addEntry = () => {
    if (Array.isArray(formdata)) {
      const newEntry = dataTypeKey.split('.').reduce<unknown>((entries, part) => {
        const property = /^\d+$/.test(part) ? 0 : part;
        const current = entries as Record<string | number, unknown> | undefined;
        return current?.[property] ?? defaultValues?.[property as keyof typeof defaultValues];
      }, {});
      const entries = [...(formdata as unknown[]), ...(Array.isArray(newEntry) ? (newEntry as unknown[]) : [newEntry])];
      // The field path and value are fully dynamic here, so cast to satisfy setValue's generic.
      setValue(dataTypeKey, entries as never);
    }
  };

  const removeEntry = (index: number) => {
    if (Array.isArray(formdata)) {
      const entries = [...(formdata as unknown[])];
      entries.splice(index, 1);
      setValue(dataTypeKey, entries as never);
    }
  };

  useEffect(() => {
    if (requiredFields && fieldpathWithoutIndex(requiredFields)?.includes(i18nKey)) {
      if (Array.isArray(formdata) && formdata.length > 0) {
        clearErrors(dataTypeKey);
      } else {
        setError(dataTypeKey, {
          message: t('common:required', { resource: capitalize(t(`${resource}:properties.${i18nKey}.DEFAULT_many`)) }),
        });
      }
    }
  }, [formdata]);

  const error = dataTypeKey
    .split('.')
    .reduce<FieldError | Merge<FieldError, FieldErrorsImpl<DataType>> | undefined>((errorpart, key) => {
      if (errorpart && typeof errorpart === 'object' && !Array.isArray(errorpart) && key in errorpart) {
        return (errorpart as Record<string, unknown>)[key] as
          FieldError | Merge<FieldError, FieldErrorsImpl<DataType>> | undefined;
      }

      return errors?.[key];
    }, undefined);

  const Headercomp: React.ElementType = `h${level}` as React.ElementType;

  return (
    <div className="flex flex-col gap-16">
      <header className="flex gap-24">
        <Headercomp className={cx('font-header', level < 3 ? 'text-h3-lg' : 'text-h4-md')}>
          {capitalize(t(`${resource}:properties.${i18nKey}.DEFAULT_many`))}
        </Headercomp>
        <Button
          size="sm"
          color="success"
          leftIcon={<Plus />}
          onClick={() => {
            addEntry();
          }}
        >
          {capitalize(t('common:add'))} {t(`${resource}:properties.${i18nKey}.DEFAULT`)}
        </Button>
      </header>
      {error?.message && (
        <FormErrorMessage className="font-bold text-error-text-primary">
          {typeof error.message === 'string' ? error.message : ''}
        </FormErrorMessage>
      )}
      {Array.isArray(formdata) &&
        formdata.map((item, index) => {
          const type = typeof item;
          const isRequired = requiredFields ? fieldpathWithoutIndex(requiredFields)?.includes(i18nKey) : false;
          if (type === 'string' || type === 'number') {
            return (
              <div key={`res-array-${index}`} className="flex justify-between items-start">
                <FormControl key={`formc-${index}`} required={isRequired}>
                  <FormLabel>{capitalize(t(`${resource}:properties.${i18nKey}`))}</FormLabel>
                  <Input type={type === 'number' ? 'number' : 'text'} {...register(`${dataTypeKey}.${index}`)} />
                </FormControl>
                <Button
                  size="sm"
                  rounded
                  color="error"
                  iconButton
                  aria-label={capitalize(
                    t('common:remove_resource', {
                      resource: t(`${resource}:properties.${i18nKey}.DEFAULT`),
                    })
                  )}
                  onClick={() => {
                    removeEntry(index);
                  }}
                >
                  <Minus />
                </Button>
              </div>
            );
          }
          if (type === 'object') {
            return Array.isArray(item) ?
                <EditResourceArray
                  key={`res-array-${index}`}
                  resource={resource}
                  parents={parents ? `${parents}.${property}` : property}
                  level={level + 1}
                  property={index.toString()}
                />
              : <EditResourceObject
                  key={`res-array-${index}`}
                  resource={resource}
                  parents={parents ? `${parents}.${property}` : property}
                  level={level + 1}
                  property={index.toString()}
                  index={index}
                  removable
                  onRemove={() => {
                    removeEntry(index);
                  }}
                />;
          }
          return null;
        })}
    </div>
  );
};
