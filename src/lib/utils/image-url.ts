import {clientEnv} from "@/env/client";
import {serverEnv} from "@/env/server";
import {CoverType} from "@/lib/types/media-common.types";
import {createServerOnlyFn} from "@tanstack/react-start";


export const getImageUrl = createServerOnlyFn(() => (coverType: CoverType, value = "default.jpg") => {
    const imageFilename = getImageFilename(value);
    return `${clientEnv.VITE_BASE_URL}/${serverEnv.UPLOADS_DIR_NAME}/${coverType}/${imageFilename}`;
})();


export const getImageFilename = (value = "default.jpg") => {
    try {
        const url = new URL(value);
        return url.pathname.split("/").pop() || "default.jpg";
    }
    catch {
        return value.split(/[\\/]/).pop()?.split("?")[0]?.split("#")[0] || "default.jpg";
    }
};
