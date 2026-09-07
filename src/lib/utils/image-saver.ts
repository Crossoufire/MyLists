import path from "path";
import crypto from "crypto";
import {isIP} from "node:net";
import ipaddr from "ipaddr.js";
import {mkdir} from "fs/promises";
import {serverEnv} from "@/env/server";
import {lookup} from "node:dns/promises";
import {get as httpsGet} from "node:https";
import type {LookupAddress} from "node:dns";
import {MAX_IMAGE_BYTES} from "@/lib/utils/constants";
import {CoverType} from "@/lib/types/media-common.types";
import {FormattedError} from "@/lib/utils/error-classes";
import {get as httpGet, type IncomingMessage} from "node:http";


type ResizeOptions = { width?: number; height: number };


interface SaveImageFromUrlOptions {
    defaultName?: string;
    dirSaveName: CoverType;
    resize?: ResizeOptions;
    imageUrl: string | undefined;
}


export const saveImageFromUrl = async ({ imageUrl, dirSaveName, resize, defaultName = "default.jpg" }: SaveImageFromUrlOptions) => {
    if (!resize) {
        resize = { width: 300, height: 450 };
    }

    try {
        if (!imageUrl) return defaultName;

        let url = new URL(imageUrl);
        const signal = AbortSignal.timeout(3000);

        for (let redirects = 0; redirects <= 5; redirects += 1) {
            signal.throwIfAborted();

            if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) {
                return defaultName;
            }

            const hostname = url.hostname.replace(/^\[|]$/g, "");
            const family = isIP(hostname);

            const addresses = family
                ? [{ address: hostname, family }]
                : await new Promise<LookupAddress[]>((res, rej) => {
                    const abort = () => rej(signal.reason);

                    signal.addEventListener("abort", abort, { once: true });

                    lookup(hostname, { all: true })
                        .then(res, rej)
                        .finally(() => signal.removeEventListener("abort", abort));
                });

            const checkIpType = addresses.some(({ address }) => {
                const parsed = ipaddr.process(address);
                return parsed.range() !== "unicast" || (parsed.kind() === "ipv6" && !parsed.match(ipaddr.parse("2000::"), 3));
            })

            if (!addresses.length || checkIpType) {
                return defaultName;
            }

            signal.throwIfAborted();
            const address = addresses[0];
            const get = url.protocol === "https:" ? httpsGet : httpGet;

            // Connect to validated IP, preserving original HTTP host and TLS identity.
            // A second DNS lookup here would allow DNS rebinding to bypass address check.
            const response = await new Promise<IncomingMessage>((res, rej) => {
                get({
                    signal,
                    agent: false,
                    family: address.family,
                    hostname: address.address,
                    path: `${url.pathname}${url.search}`,
                    servername: family ? undefined : hostname,
                    port: url.port || (url.protocol === "https:" ? 443 : 80),
                    headers: { Host: url.host, "Accept-Encoding": "identity" },
                }, res).on("error", rej);
            });

            try {
                if ([301, 302, 303, 307, 308].includes(response.statusCode!)) {
                    if (!response.headers.location) return defaultName;
                    url = new URL(response.headers.location, url);
                    continue;
                }

                if (response.statusCode! < 200 || response.statusCode! >= 300) return defaultName;

                // Images are already compressed. Reject unsolicited HTTP compression to avoid expansion bombs
                if (response.headers["content-encoding"] && response.headers["content-encoding"] !== "identity") return defaultName;

                if (Number(response.headers["content-length"]) > MAX_IMAGE_BYTES) return defaultName;

                let size = 0;
                const chunks: Buffer[] = [];
                for await (const chunk of response) {
                    size += chunk.length;
                    if (size > MAX_IMAGE_BYTES) return defaultName;
                    chunks.push(chunk);
                }

                const buffer = Buffer.concat(chunks, size);
                return await processAndSaveImage({ buffer, dirSaveName, resize });
            }
            finally {
                response.destroy();
            }
        }

        return defaultName;
    }
    catch {
        return defaultName;
    }
};


interface SaveUploadedImageOptions {
    file: File;
    resize?: ResizeOptions;
    dirSaveName: CoverType;
}


export const saveUploadedImage = async ({ file, dirSaveName, resize }: SaveUploadedImageOptions) => {
    if (file.size === 0 || file.size > MAX_IMAGE_BYTES) {
        throw new FormattedError("Choose a non-empty image of 10MB or smaller.");
    }

    if (!resize) {
        resize = { width: 300, height: 450 };
    }

    try {
        const buffer = Buffer.from(await file.arrayBuffer());
        return processAndSaveImage({ buffer, dirSaveName, resize });
    }
    catch {
        throw new FormattedError("This image could not be processed");
    }
};


interface ProcessAndSaveImageOptions {
    buffer: Buffer;
    resize: ResizeOptions;
    dirSaveName: CoverType;
}


const processAndSaveImage = async ({ buffer, dirSaveName, resize }: ProcessAndSaveImageOptions) => {
    const randomHex = crypto.randomBytes(16).toString("hex");
    const fileName = `${randomHex}.jpg`;

    const base = serverEnv.BASE_UPLOADS_LOCATION;
    const saveLocation = path.isAbsolute(base)
        ? path.join(base, dirSaveName)
        : path.join(process.cwd(), base, dirSaveName);

    await mkdir(saveLocation, { recursive: true });
    const filePath = path.join(saveLocation, fileName);

    try {
        const image = new Bun.Image(buffer);

        let width = resize.width;
        if (!width) {
            const metadata = await image.metadata();
            width = Math.max(1, Math.round((metadata.width / metadata.height) * resize.height));
        }

        image.resize(width, resize.height);
        await image.jpeg({ quality: 90 }).write(filePath);
    }
    catch {
        throw new FormattedError("This image could not be processed");
    }

    return fileName;
};
