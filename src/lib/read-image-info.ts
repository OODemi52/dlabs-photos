import sharp from "sharp";

export type ImageInfo = {
  width: number;
  height: number;
};

export async function readImageInfo(filePath: string): Promise<ImageInfo> {
  const metadata = await sharp(filePath).metadata();

  if (!metadata.width || !metadata.height) {
    throw new Error(`Could not read image dimensions for ${filePath}`);
  }

  return {
    width: metadata.width,
    height: metadata.height
  };
}
