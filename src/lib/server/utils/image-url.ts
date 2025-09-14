import {clientEnv} from "@/env/client";
import {serverEnv} from "@/env/server";
import {CoverType} from "@/lib/types/base.types";


export const getImageUrl = (coverType: CoverType, value = "default.jpg") => {
    return `${clientEnv.VITE_BASE_URL}/${serverEnv.UPLOADS_DIR_NAME}/${coverType}/${value}`;
};
