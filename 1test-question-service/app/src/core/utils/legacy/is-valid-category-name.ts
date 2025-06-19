import { CATEGORY_NAME_REGEX } from '@/core/constants/regex';

export function isValidCategoryName(name: string): boolean {
  return CATEGORY_NAME_REGEX.test(name);
}
