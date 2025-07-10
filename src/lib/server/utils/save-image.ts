import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import {promises as fsPromises} from "node:fs";
import {FormattedError} from "@/lib/server/utils/error-classes";


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


interface SaveUploadedImageOptions {
    file: File;
    saveLocation: string;
    resize?: ResizeOptions;
}


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


export const saveUploadedImage = async ({ file, saveLocation, resize }: SaveUploadedImageOptions) => {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        return processAndSaveImage({ buffer, saveLocation, resize });
    }
    catch (error) {
        throw new FormattedError("This image could not be processed");
    }
};


const processAndSaveImage = async ({ buffer, saveLocation, resize }: ProcessAndSaveImageOptions) => {
    const randomHex = crypto.randomBytes(8).toString("hex");
    const fileName = `${randomHex}.jpg`;

    await fsPromises.mkdir(saveLocation, { recursive: true });
    const filePath = path.join(saveLocation, fileName);

    const sharpInstance = sharp(buffer);
    if (resize) {
        sharpInstance.resize(resize.width, resize.height);
    }

    await sharpInstance.jpeg({ quality: 90 }).toFile(filePath);

    return fileName;
};
