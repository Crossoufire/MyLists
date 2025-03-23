import path from "path";
import crypto from "crypto";
import * as fs from "node:fs";
import {fileTypeFromBuffer} from "file-type";


export async function saveImage(file: File): Promise<string | null> {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Check file type
        const fileType = await fileTypeFromBuffer(buffer);
        const allowedTypes = ["image/gif", "image/jpeg", "image/png", "image/webp", "image/tiff"];

        // Return null if file type not allowed
        if (!fileType || !allowedTypes.includes(fileType.mime)) {
            return null;
        }

        // Generate random filename
        const randomHex = crypto.randomBytes(8).toString("hex");
        const fileExtension = path.extname(file.name);
        const fileName = randomHex + fileExtension;

        // Ensure directory exists
        const uploadDir = path.join(process.cwd(), "public", "static", "recipe-images");
        fs.mkdirSync(uploadDir, { recursive: true });

        // Save file
        const filePath = path.join(uploadDir, fileName);
        fs.writeFileSync(filePath, buffer);

        return fileName;
    }
    catch (error) {
        return null;
    }
}
