import { defaultInformationFields } from '@config/defaults';
import resources from '@config/resources';
import { Resource } from '@interfaces/resource';
import { ResourceName } from '@interfaces/resource-name';
import { Fragment } from 'react';
import { FieldValues, useFormContext } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { capitalize } from 'underscore.string';

import { EditResourceArray } from './edit-resource-array.component';
import { EditResourceInput } from './edit-resource-input.component';
import { EditResourceObject } from './edit-resource-object.component';

interface EditResourceProps {
  resource: ResourceName;
  isNew?: boolean;
}

export const EditResource: React.FC<EditResourceProps> = ({ resource }) => {
  const { t } = useTranslation();
  const { requiredFields } = resources[resource];

  type DataType = Parameters<NonNullable<Resource<FieldValues>['create']>>[0];

  const { watch } = useFormContext<DataType>();
  const formdata = watch();

  return (
    <>
      <div className="flex flex-col gap-32 grow mb-32">
        {Object.keys(formdata)
          .filter((key) => !defaultInformationFields.includes(key))
          .map((key, index) => {
            const isRequired = requiredFields ? requiredFields.includes(key as (typeof requiredFields)[number]) : false;

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
            return null;
          })}
      </div>
    </>
  );
};
