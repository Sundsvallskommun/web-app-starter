import { HttpException } from '@exceptions/HttpException';
import { ClassConstructor, plainToInstance } from 'class-transformer';
import { validate, ValidationError } from 'class-validator';
import { RequestHandler } from 'express';

const getAllNestedErrors = (error: ValidationError): string => {
  if (error.constraints) {
    return Object.values(error.constraints).join(', ');
  }
  return (error.children ?? []).map(getAllNestedErrors).join(', ');
};

export const validationMiddleware = (
  type: ClassConstructor<object>,
  value: 'body' | 'query' | 'params' = 'body',
  skipMissingProperties = false,
  whitelist = true,
  forbidNonWhitelisted = true,
): RequestHandler => {
  return async (req, res, next) => {
    try {
      const obj = plainToInstance(type, req[value] as object);
      const errors = await validate(obj, { skipMissingProperties, whitelist, forbidNonWhitelisted });
      if (errors.length > 0) {
        const message = errors.map(getAllNestedErrors).join(', ');
        next(new HttpException(400, message));
      } else {
        next();
      }
    } catch (error) {
      next(error);
    }
  };
};
