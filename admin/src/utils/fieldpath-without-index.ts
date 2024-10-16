import { FieldPath } from 'react-hook-form';

export const fieldpathWithoutIndex = (fieldpath: FieldPath<any> | Array<FieldPath<any>>) => {
  const replacer = (string: string) => string.replace(/[.]\d+/g, '');
  if (typeof fieldpath === 'string') {
    return replacer(fieldpath);
  }
  if (Array.isArray(fieldpath)) {
    return fieldpath.map((path) => replacer(path));
  }
};
