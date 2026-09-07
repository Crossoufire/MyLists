import {expect, it, vi} from "vitest";


const {createRateLimiter} = vi.hoisted(() => ({
    createRateLimiter: vi.fn(),
}));


vi.mock("@/env/server", () => ({ serverEnv: {} }));
vi.mock("@/lib/server/core/rate-limiter", () => ({ createRateLimiter }));
vi.mock("@tanstack/react-start/server", () => ({
    deleteCookie: vi.fn(),
    getCookie: vi.fn(),
    setCookie: vi.fn(),
}));


it("does not initialize a Redis rate limiter when prerendering imports admin utilities", async () => {
    await import("@/lib/utils/admin-utils");

    expect(createRateLimiter).not.toHaveBeenCalled();
});
