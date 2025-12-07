import {createStart} from "@tanstack/react-start";
import {funcErrorMiddleware} from "@/lib/server/middlewares/global-error";
import {formattedErrorAdapter, formZodErrorAdapter} from "@/lib/utils/error-classes";


export const startInstance = createStart(() => {
    return {
        defaultSsr: false,
        functionMiddleware: [funcErrorMiddleware],
        serializationAdapters: [
            formZodErrorAdapter,
            formattedErrorAdapter,
        ],
    }
});
