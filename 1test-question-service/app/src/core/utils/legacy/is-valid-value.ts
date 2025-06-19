type _Value = number | string | null | undefined;
type _Object = { [key: string | number]: _Value };

export function isValidValue(value: _Value, excludedList: Array<_Value>) {
  return !excludedList.includes(value);
}

export function isValidObjectValues(obj: _Object, excludedList: Array<_Value>) {
  return Object.values(obj).every((value) => isValidValue(value, excludedList));
}
