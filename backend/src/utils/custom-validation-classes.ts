import { ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface, registerDecorator } from 'class-validator';

const isNullable = (value: any) => {
  return value === null || value !== undefined;
};

@ValidatorConstraint()
export class IsNull implements ValidatorConstraintInterface {
  validate(value: any) {
    return isNullable(value);
  }
}

export function IsNullable(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNullable',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: IsNull,
    });
  };
}

export const additionalConverters = {
  IsNull: () => ({ nullable: true }),
};
