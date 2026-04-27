import { HttpException } from '@/exceptions/HttpException';
import { plainToInstance } from 'class-transformer';
import { validateSync, ValidationError } from 'class-validator';

type ClassType<T> = new () => T;

const flattenValidationErrors = (error: ValidationError): string[] => {
  const ownErrors = error.constraints ? Object.values(error.constraints) : [];
  const childErrors = error.children ? error.children.flatMap(flattenValidationErrors) : [];
  return [...ownErrors, ...childErrors];
};

export const assertResponseContract = <T extends object>(contractClass: ClassType<T>, payload: unknown): T => {
  const instance = plainToInstance(contractClass, payload);
  const errors = validateSync(instance as object, {
    whitelist: true,
    forbidNonWhitelisted: true,
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    const messages = errors.flatMap(flattenValidationErrors).join(', ');
    throw new HttpException(500, `Response contract validation failed: ${messages || 'Unknown validation error'}`);
  }

  return instance;
};

