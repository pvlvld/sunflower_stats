import sharp from "sharp";

async function resizeImage(inputBuffer: Buffer) {
  return await sharp(inputBuffer).resize(1280, 640).toBuffer();
}

export { resizeImage };
