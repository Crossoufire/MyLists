import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import {fileTypeFromBuffer} from "file-type";
import fs, {promises as fsPromises} from "node:fs";


interface ResizeOptions {
    width: number;
    height: number;
}


interface ProcessAndSaveImageOptions {
    buffer: Buffer;
    saveLocation: string;
    resize?: ResizeOptions;
}


interface SaveImageFromUrlOptions {
    imageUrl: string;
    defaultName: string;
    saveLocation: string;
    resize?: ResizeOptions;
}


const ALLOWED_IMAGE_TYPES = ["image/gif", "image/jpeg", "image/png", "image/webp", "image/tiff"];


const processAndSaveImage = async ({ buffer, saveLocation, resize }: ProcessAndSaveImageOptions) => {
    const fileType = await fileTypeFromBuffer(buffer);
    if (!fileType || !ALLOWED_IMAGE_TYPES.includes(fileType.mime)) {
        throw new Error(`Invalid or unsupported image type: ${fileType?.mime || "unknown"}`);
    }

    const randomHex = crypto.randomBytes(8).toString("hex");
    const fileName = `${randomHex}.${fileType.ext}`;

    fs.mkdirSync(saveLocation, { recursive: true });
    const filePath = path.join(saveLocation, fileName);

    resize ?
        await sharp(buffer).resize(resize.width, resize.height).toFile(filePath)
        :
        await fsPromises.writeFile(filePath, buffer);

    return fileName;
};


export const saveImageFromUrl = async ({ imageUrl, saveLocation, defaultName, resize }: SaveImageFromUrlOptions) => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            return defaultName;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return processAndSaveImage({ buffer, saveLocation, resize });
    }
    catch {
        return defaultName;
    }
};


export const saveUploadedImage = async (file: File, saveLocation: string, resize: ResizeOptions) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return processAndSaveImage({ buffer, saveLocation, resize });
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(error.message);
        }
        throw new Error("This image could not be processed");
    }
};
