import {notFound} from "@tanstack/react-router";


export function tryNotFound<T>(callback: () => T): T {
    try {
        return callback();
    }
    catch {
        throw notFound();
    }
}