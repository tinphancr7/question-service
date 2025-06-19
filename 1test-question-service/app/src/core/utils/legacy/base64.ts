function b64UrlSafeEncode(s: string) {
  return Buffer.from(s).toString('base64url');
}

function b64UrlSafeDecode(s: string) {
  return Buffer.from(s, 'base64url').toString('ascii');
}

export const base64 = {
  b64UrlSafeEncode,
  b64UrlSafeDecode,
};
