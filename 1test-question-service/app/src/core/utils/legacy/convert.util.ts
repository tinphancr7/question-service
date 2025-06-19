import { InvalidBooleanValueError } from '@/core/types/errors';

export const stringToBoolean = (value: string): boolean => {
  if (value === 'true' || value === 'True' || value === 'TRUE') {
    return true;
  } else if (value === 'false' || value === 'False' || value === 'FALSE') {
    return false;
  } else {
    throw new InvalidBooleanValueError(
      null,
      `Can not convert ${value} to boolean`,
    );
  }
};
