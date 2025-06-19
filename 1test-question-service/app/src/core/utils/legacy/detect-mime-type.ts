/**
 * https://en.wikipedia.org/wiki/List_of_file_signatures
 */
export const SIGNATURES: Record<string, string> = {
  // Image
  '/9j/': 'image/jpg',
  iVBORw0KGgo: 'image/png',
  R0lGODdh: 'image/gif',
  R0lGODlh: 'image/gif',

  // Audio
  '//s': 'audio/mpeg',
  '//M': 'audio/mpeg',
  '//I': 'audio/mpeg',
  SUQz: 'audio/mpeg',

  // Others
  JVBERi0: 'application/pdf',
};

const DEFAULT = 'application/octet-stream';

export function detectMimeType(base64: string): string {
  for (const s in SIGNATURES) {
    if (base64.startsWith(s)) {
      return SIGNATURES[s];
    }
  }

  return DEFAULT;
}

/**
 * Check if the content type is 'string'
 * eg: isTypeEqual('image', 'image/png') == true
 */
export function isTypeEqual(type: string, contentType: string): boolean {
  return contentType.startsWith(type);
}
