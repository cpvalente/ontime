import { multipleValuesPlaceholder } from '../../../common/utils/multiValueText';

export const getInitialAndPlaceholder = (
  value: string | undefined,
  isMultiple?: boolean,
): [string, string | undefined] => {
  return isMultiple && value === undefined ? ['', multipleValuesPlaceholder] : [value ?? '', undefined];
};
