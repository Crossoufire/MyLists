import path from "path";
import sharp from "sharp";
import fs from "fs/promises";


export const pixelateImage = async (url: string, level: number) => {
    // Derive disk path from URL
    const staticIndex = url.indexOf("/static");
    const partial = staticIndex !== -1 ? url.substring(staticIndex) : "";
    const absPath = path.join(process.cwd(), "public", partial);

    // Scale lookup (1 = heavy pix, 5 = light pix)
    const scaleFactors: Record<number, number> = { 5: 6, 4: 7, 3: 8, 2: 10, 1: 12 };
    const factor = scaleFactors[level];

    // Read buffer + metadata
    const inputBuffer = await fs.readFile(absPath);
    const meta = await sharp(inputBuffer).metadata();
    const w = meta.width!;
    const h = meta.height!;

    // Compute tiny size
    const tinyW = Math.max(1, Math.floor(w / factor));
    const tinyH = Math.max(1, Math.floor(h / factor));

    // First resize to small buffer
    const smallBuffer = await sharp(inputBuffer)
        .resize(tinyW, tinyH, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();

    // Resize to final buffer
    const pixelatedBuffer = await sharp(smallBuffer)
        .resize(w, h, { kernel: sharp.kernel.nearest })
        .png()
        .toBuffer();

    return pixelatedBuffer.toString("base64");
};
