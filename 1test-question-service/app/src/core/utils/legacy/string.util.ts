export const capitalizeFirstLetter = (value: string): string => {
  return value.charAt(0).toUpperCase() + value.slice(1);
};

export const replaceLineBreaksWithSpace = (value: string): string => {
  const valueWithoutLineBreaks = value.replace(/(\r\n|\n|\r)/gm, ' ');
  const valueWithSingleSpace = valueWithoutLineBreaks.replace(/\s+/g, ' ');

  return valueWithSingleSpace;
};

export const removeFirstAndLastCharacter = (str: string): string => {
  return str.substring(1, str.length - 1);
};

/**
 * Shuffles an array of strings using the Fisher-Yates algorithm.
 * @param arr - The string array to shuffle.
 * @returns A new shuffled array.
 */
export const shuffle = (arr: string[]): string[] => {
  const shuffled = [...arr]; // Create a copy to avoid mutating the original array
  for (let i = shuffled.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    // Swap the elements
    [shuffled[i], shuffled[randomIndex]] = [shuffled[randomIndex], shuffled[i]];
  }
  return shuffled;
};
