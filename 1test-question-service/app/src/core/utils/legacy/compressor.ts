import sharp from 'sharp';

export async function compressImageToWebp(buffer: Buffer) {
  return await sharp(buffer).webp().toBuffer();
}
