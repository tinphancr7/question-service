export function genByDate(key?: string) {
  const date = new Date();
  let output = `A-${date.getTime()}`;
  if (key) output += `-${key}`;
  return output;
}
