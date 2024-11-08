import { defaultInformationFields } from '@config/defaults';
import resources from '@config/resources';
import { Fragment } from 'react';
import { useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';
import { EditResourceArray } from './edit-resource-array.component';
import { EditResourceInput } from './edit-resource-input.component';
import { EditResourceObject } from './edit-resource-object.component';
import { ResourceName } from '@interfaces/resource-name';

interface EditResourceProps {
  resource?: ResourceName;
  isNew?: boolean;
}

export const EditResource: React.FC<EditResourceProps> = ({ resource, isNew }) => {
  const { t } = useTranslation();
  const { create, update, requiredFields } = resources[resource];

  type CreateType = Parameters<typeof create>[0];
  type UpdateType = Parameters<typeof update>[1];
  type DataType = CreateType | UpdateType;

  const { watch } = useFormContext<DataType>();
  const formdata = watch();

  return (
    <>
      <div className="flex flex-col gap-32 grow mb-32">
        {Object.keys(formdata)
          .filter((key) => !defaultInformationFields.includes(key))
          .map((key, index) => {
            const isRequired = requiredFields.includes(key as keyof DataType);

            return (
              <Fragment key={`formc-${index}`}>
                <EditResourceInput
                  property={key}
                  index={index}
                  required={isRequired}
                  label={capitalize(t(`${resource}:properties.${key}`))}
                />
              </Fragment>
            );
          })}
      </div>
      <div className="flex flex-col gap-32 grow mb-32">
        {Object.keys(formdata)
          .filter((key) => !defaultInformationFields.includes(key))
          .map((key, index) => {
            const type = typeof formdata[key];
            if (type === 'object') {
              return Array.isArray(formdata[key]) ?
                  <EditResourceArray key={`res-${index}`} resource={resource} property={key} />
                : <EditResourceObject key={`res-${index}`} resource={resource} property={key} />;
            }
          })}
      </div>
    </>
  );
};
