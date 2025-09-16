import path from "path";
import sharp from "sharp";
import crypto from "crypto";
import {promises as fsPromises} from "node:fs";
import {CoverType} from "@/lib/types/base.types";
import {FormattedError} from "@/lib/server/utils/error-classes";
import {serverEnv} from "@/env/server";


interface ResizeOptions {
    width: number;
    height: number;
}


interface ProcessAndSaveImageOptions {
    buffer: Buffer;
    dirSaveName: CoverType;
    resize?: ResizeOptions;
}


interface SaveImageFromUrlOptions {
    defaultName?: string;
    dirSaveName: CoverType;
    resize?: ResizeOptions;
    imageUrl: string | undefined;
}


interface SaveUploadedImageOptions {
    file: File;
    resize?: ResizeOptions;
    dirSaveName: Extract<CoverType, "profile-covers" | "profile-back-covers">;
}


export const saveImageFromUrl = async ({ imageUrl, dirSaveName, resize, defaultName = "default.jpg" }: SaveImageFromUrlOptions) => {
    if (!resize) {
        resize = { width: 300, height: 450 };
    }

    try {
        const response = await fetch(imageUrl!, { signal: AbortSignal.timeout(3000) });
        if (!response.ok) {
            return defaultName;
        }

        const arrayBuffer = await response.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        return processAndSaveImage({ buffer, dirSaveName, resize });
    }
    catch {
        return defaultName;
    }
};


export const saveUploadedImage = async ({ file, dirSaveName, resize }: SaveUploadedImageOptions) => {
    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        return processAndSaveImage({ buffer, dirSaveName, resize });
    }
    catch {
        throw new FormattedError("This image could not be processed");
    }
};


const processAndSaveImage = async ({ buffer, dirSaveName, resize }: ProcessAndSaveImageOptions) => {
    const randomHex = crypto.randomBytes(16).toString("hex");
    const fileName = `${randomHex}.jpg`;

    const base = serverEnv.BASE_UPLOADS_LOCATION;
    const saveLocation = path.isAbsolute(base)
        ? path.join(base, dirSaveName)
        : path.join(process.cwd(), base, dirSaveName);

    await fsPromises.mkdir(saveLocation, { recursive: true });
    const filePath = path.join(saveLocation, fileName);

    const sharpInstance = sharp(buffer);
    if (resize) {
        sharpInstance.resize(resize.width, resize.height);
    }

    await sharpInstance
        .jpeg({ quality: 90 })
        .toFile(filePath);

    return fileName;
};
