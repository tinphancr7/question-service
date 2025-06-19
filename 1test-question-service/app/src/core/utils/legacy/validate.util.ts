import { BadRequestError, InvalidRangeError } from '@/core/types/errors';
import { PathProps, ValidateRangeNumberProps } from '@/core/types/legacy';

import { capitalizeFirstLetter } from './string.util';

export const validateRequiredFields = <Input extends Record<string, any>>(
  input: Input,
  requiredFields: string[],
): void => {
  const missingFieldKeys = requiredFields.filter((field) => {
    return (
      input[field] === undefined || input[field] === null || input[field] === ''
    );
  });

  if (missingFieldKeys.length > 0) {
    const missingFieldKeysErrorString = missingFieldKeys.join(', ');

    throw new BadRequestError(
      null,
      `Missing/empty required fields: ${missingFieldKeysErrorString}`,
    );
  }
};

export const validateRangeNumber = (props: ValidateRangeNumberProps): void => {
  const { fieldName, fieldValue, min, max } = props;

  if (min > max) {
    throw new InvalidRangeError(
      null,
      `Invalid range: min = ${min}, max = ${max}`,
    );
  }

  if (fieldValue < min || fieldValue > max) {
    throw new BadRequestError(
      null,
      `${capitalizeFirstLetter(fieldName)} must be in range ${min}-${max}, received: ${fieldValue}`,
    );
  }
};

export const isNullOrUndefined = <T>(value: T): boolean => {
  if (value === null || value === undefined || value === '') {
    return true;
  }

  return false;
};

export const isPathValid = (props: PathProps): boolean => {
  const {
    subjectId,
    examClassificationId,
    areaId,
    questionTypeId,
    questionFormatId,
  } = props;

  if (questionFormatId && !questionTypeId) {
    return false;
  }
  if (questionTypeId && !areaId) {
    return false;
  }
  if (areaId && !examClassificationId) {
    return false;
  }
  if (examClassificationId && !subjectId) {
    return false;
  }

  return true;
};

export const validatePathProps = (props: PathProps): void => {
  if (!isPathValid(props)) {
    const categories = Object.keys(props);
    throw new BadRequestError(
      null,
      `Provided categories are invalid: ${categories.join(', ')}`,
    );
  }
};
