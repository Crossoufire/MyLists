import {getCookie, setCookie} from "@tanstack/react-start/server";


const algorithm = { name: "HMAC", hash: "SHA-256" };

const sign = async (value: string, secret: string) => {
    const key = await crypto.subtle.importKey(
        "raw",
        new TextEncoder().encode(secret),
        algorithm,
        false,
        ["sign"]
    );
    const sig = await crypto.subtle.sign(
        algorithm,
        key,
        new TextEncoder().encode(value)
    );
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
};


export const getSignedCookie = async (name: string, secret: string) => {
    const raw = getCookie(name);
    if (!raw) return null;

    const decoded = decodeURIComponent(raw);
    const dotIdx = decoded.lastIndexOf(".");
    if (dotIdx < 1) return null;

    const value = decoded.slice(0, dotIdx);
    const sig = decoded.slice(dotIdx + 1);

    return sig === (await sign(value, secret)) ? value : null;
};


export const setSignedCookie = async (name: string, value: string, secret: string, maxAge?: number) => {
    const sig = await sign(value, secret);

    setCookie(name, `${encodeURIComponent(value)}.${sig}`, {
        maxAge,
        path: "/",
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
    });
};
