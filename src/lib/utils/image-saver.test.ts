import path from "node:path";
import {tmpdir} from "node:os";
import {Readable} from "node:stream";
import {EventEmitter} from "node:events";
import {mkdtemp, readFile, rm} from "node:fs/promises";
import type {IncomingMessage} from "node:http";
import {afterAll, beforeAll, beforeEach, describe, expect, it, vi} from "vitest";
import {MAX_IMAGE_BYTES} from "@/lib/utils/constants";
import {saveImageFromUrl, saveUploadedImage} from "@/lib/utils/image-saver";


const mocks = vi.hoisted(() => ({
    lookup: vi.fn(),
    httpGet: vi.fn(),
    httpsGet: vi.fn(),
    env: { BASE_UPLOADS_LOCATION: "" },
}));

vi.mock("@/env/server", () => ({ serverEnv: mocks.env }));
vi.mock("node:dns/promises", () => ({ lookup: mocks.lookup }));
vi.mock("node:http", () => ({ get: mocks.httpGet }));
vi.mock("node:https", () => ({ get: mocks.httpsGet }));

const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aWQAAAABJRU5ErkJggg==", "base64");
const options = { dirSaveName: "movies-covers" as const, imageUrl: "https://covers.example/cover.png" };

const respond = (chunks = [png], statusCode = 200, headers: IncomingMessage["headers"] = {}) => {
    const response = Object.assign(Readable.from(chunks), { statusCode, headers });
    return {
        response,
        get: (_options: unknown, callback: (response: Readable) => void) => {
            queueMicrotask(() => callback(response));
            return new EventEmitter();
        },
    };
};


beforeAll(async () => {
    mocks.env.BASE_UPLOADS_LOCATION = await mkdtemp(path.join(tmpdir(), "mylists-image-test-"));
});

afterAll(async () => {
    await rm(mocks.env.BASE_UPLOADS_LOCATION, { recursive: true, force: true });
});

beforeEach(() => {
    vi.restoreAllMocks();
    mocks.lookup.mockReset().mockResolvedValue([{ address: "93.184.215.14", family: 4 }]);
    mocks.httpGet.mockReset();
    mocks.httpsGet.mockReset().mockImplementation(respond().get);
});


describe("server-side cover downloads", () => {
    it.each([
        "file:///tmp/private.png", "s3://private-bucket/image.png", "data:image/png;base64,AA==",
        "http://127.0.0.1/", "http://127.1/", "http://2130706433/", "http://0x7f000001/",
        "http://0.0.0.0/", "http://10.0.0.1/", "http://172.16.0.1/", "http://192.168.1.1/",
        "http://169.254.169.254/", "http://100.100.100.200/", "http://198.18.0.1/",
        "http://224.0.0.1/", "http://240.0.0.1/", "http://[::1]/", "http://[::]/",
        "http://[::ffff:127.0.0.1]/", "http://[fc00::1]/", "http://[fe80::1]/",
        "http://[64:ff9b::7f00:1]/", "http://[2002:7f00:1::]/", "http://[2001:db8::1]/",
        "http://[4000::1]/", "https://user:password@covers.example/image.png",
    ])("rejects unsafe URL %s before making a request", async (imageUrl) => {
        expect(await saveImageFromUrl({ ...options, imageUrl })).toBe("default.jpg");
        expect(mocks.lookup).not.toHaveBeenCalled();
        expect(mocks.httpGet).not.toHaveBeenCalled();
        expect(mocks.httpsGet).not.toHaveBeenCalled();
    });

    it.each(["127.0.0.1", "10.0.0.1", "169.254.169.254", "::1", "::ffff:192.168.1.1"])(
        "rejects a hostname resolving to %s, even alongside a public address", async (address) => {
            mocks.lookup.mockResolvedValue([
                { address: "93.184.215.14", family: 4 },
                { address, family: address.includes(":") ? 6 : 4 },
            ]);
            expect(await saveImageFromUrl(options)).toBe("default.jpg");
            expect(mocks.httpsGet).not.toHaveBeenCalled();
        },
    );

    it("pins the connection to the checked IP and preserves HTTPS hostname verification", async () => {
        const filename = await saveImageFromUrl(options);
        expect(filename).not.toBe("default.jpg");
        expect(mocks.lookup).toHaveBeenCalledExactlyOnceWith("covers.example", { all: true });
        expect(mocks.httpsGet).toHaveBeenCalledWith(expect.objectContaining({
            hostname: "93.184.215.14", servername: "covers.example", family: 4,
            port: 443, path: "/cover.png", agent: false,
            headers: { Host: "covers.example", "Accept-Encoding": "identity" },
        }), expect.any(Function));
        const saved = await readFile(path.join(mocks.env.BASE_UPLOADS_LOCATION, "movies-covers", filename));
        expect(saved.subarray(0, 2)).toEqual(Buffer.from([0xff, 0xd8]));
    });

    it("allows public IPv6 destinations", async () => {
        expect(await saveImageFromUrl({ ...options, imageUrl: "https://[2606:4700::1111]/cover.png" })).not.toBe("default.jpg");
        expect(mocks.lookup).not.toHaveBeenCalled();
        expect(mocks.httpsGet).toHaveBeenCalledWith(expect.objectContaining({
            hostname: "2606:4700::1111", family: 6,
        }), expect.any(Function));
    });

    it.each(["http://127.0.0.1/private", "file:///tmp/private.png", "http://internal.example/image.png"])(
        "blocks redirect to %s", async (location) => {
            const redirect = respond([], 302, { location });
            mocks.httpsGet.mockImplementationOnce(redirect.get);
            mocks.lookup.mockResolvedValueOnce([{ address: "93.184.215.14", family: 4 }])
                .mockResolvedValueOnce([{ address: "192.168.1.1", family: 4 }]);
            expect(await saveImageFromUrl(options)).toBe("default.jpg");
            expect(mocks.httpsGet).toHaveBeenCalledTimes(1);
            expect(mocks.httpGet).not.toHaveBeenCalled();
            expect(redirect.response.destroyed).toBe(true);
        },
    );

    it("rechecks DNS on a same-host redirect to stop rebinding", async () => {
        mocks.httpsGet.mockImplementationOnce(respond([], 302, { location: "/next.png" }).get);
        mocks.lookup.mockResolvedValueOnce([{ address: "93.184.215.14", family: 4 }])
            .mockResolvedValueOnce([{ address: "127.0.0.1", family: 4 }]);
        expect(await saveImageFromUrl(options)).toBe("default.jpg");
        expect(mocks.httpsGet).toHaveBeenCalledTimes(1);
    });

    it("follows a public redirect and resolves relative URLs", async () => {
        mocks.httpsGet.mockImplementationOnce(respond([], 302, { location: "/next.png?size=large" }).get);
        expect(await saveImageFromUrl(options)).not.toBe("default.jpg");
        expect(mocks.httpsGet).toHaveBeenLastCalledWith(expect.objectContaining({ path: "/next.png?size=large" }), expect.any(Function));
        expect(mocks.lookup).toHaveBeenCalledTimes(2);
    });

    it("stops redirect loops after five redirects", async () => {
        mocks.httpsGet.mockImplementation((options, callback) => respond([], 302, { location: "/again" }).get(options, callback));
        expect(await saveImageFromUrl(options)).toBe("default.jpg");
        expect(mocks.httpsGet).toHaveBeenCalledTimes(6);
    });

    it.each([{}, { "content-length": "1" }])("limits actual streamed bytes regardless of size headers %j", async (headers) => {
        const download = respond([Buffer.alloc(MAX_IMAGE_BYTES), Buffer.alloc(1)], 200, headers);
        mocks.httpsGet.mockImplementationOnce(download.get);
        expect(await saveImageFromUrl(options)).toBe("default.jpg");
        expect(download.response.destroyed).toBe(true);
    });

    it.each([
        { "content-length": String(MAX_IMAGE_BYTES + 1) },
        { "content-encoding": "gzip" },
        { "content-encoding": "br" },
    ])("rejects unsafe response headers %j", async (headers) => {
        const download = respond([png], 200, headers);
        mocks.httpsGet.mockImplementationOnce(download.get);
        expect(await saveImageFromUrl(options)).toBe("default.jpg");
        expect(download.response.destroyed).toBe(true);
    });

    it("returns the configured default for invalid image data", async () => {
        mocks.httpsGet.mockImplementationOnce(respond([Buffer.from("not an image")]).get);
        expect(await saveImageFromUrl({ ...options, defaultName: "missing.jpg" })).toBe("missing.jpg");
    });

    it("bounds DNS resolution with the download timeout", async () => {
        const controller = new AbortController();
        vi.spyOn(AbortSignal, "timeout").mockReturnValue(controller.signal);
        mocks.lookup.mockImplementation(() => new Promise(() => {}));
        const result = saveImageFromUrl(options);
        controller.abort();
        expect(await result).toBe("default.jpg");
        expect(mocks.httpsGet).not.toHaveBeenCalled();
    });
});


describe("cover uploads", () => {
    it("rejects oversized files before reading them", async () => {
        const file = new File([new Uint8Array(MAX_IMAGE_BYTES + 1)], "large.png");
        const read = vi.spyOn(file, "arrayBuffer");
        await expect(saveUploadedImage({ file, dirSaveName: "movies-covers" })).rejects.toThrow("10MB");
        expect(read).not.toHaveBeenCalled();
    });

    it("still saves an uploaded image", async () => {
        const file = new File([png], "cover.png", { type: "image/png" });
        expect(await saveUploadedImage({ file, dirSaveName: "movies-covers" })).toMatch(/\.jpg$/);
    });
});
