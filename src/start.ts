import {createStart} from "@tanstack/react-start";
import {funcErrorMiddleware, reqErrorMiddleware} from "@/lib/server/middlewares/global-error";
import {formattedErrorAdapter, formZodErrorAdapter, unauthorizedErrorAdapter} from "@/lib/utils/error-classes";


export const startInstance = createStart(() => {
    return {
        defaultSsr: false,
        requestMiddleware: [reqErrorMiddleware],
        functionMiddleware: [funcErrorMiddleware],
        serializationAdapters: [
            formZodErrorAdapter,
            formattedErrorAdapter,
            unauthorizedErrorAdapter,
        ],
    }
});
