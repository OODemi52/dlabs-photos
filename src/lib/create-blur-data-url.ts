import sharp from "sharp";

export async function createBlurDataUrl(filePath: string) {
  const buffer = await sharp(filePath)
    .rotate()
    .resize({
      width: 32,
      height: 32,
      fit: "inside",
      withoutEnlargement: true
    })
    .jpeg({
      quality: 48,
      mozjpeg: true
    })
    .toBuffer();

  return `data:image/jpeg;base64,${buffer.toString("base64")}`;
}
