export const getStaticCacheControl = (pathname: string) => {
    // Vite fingerprints built assets; image-saver gives each saved image a new random filename.
    const isVersioned = /^\/assets\/[^/]+-[\w-]{8}\.[^/]+$/.test(pathname)
        || /(?:^|\/)[a-f0-9]{32}\.jpg$/.test(pathname);

    return isVersioned ? "public, max-age=31536000, immutable" : "no-cache";
};
