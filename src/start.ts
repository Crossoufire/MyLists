import {createStart} from "@tanstack/react-start";
import {formattedErrorAdapter, formZodErrorAdapter} from "@/lib/utils/error-classes";
import {funcErrorMiddleware, reqErrorMiddleware} from "@/lib/server/middlewares/global-error";


export const startInstance = createStart(() => {
    return {
        defaultSsr: false,
        requestMiddleware: [reqErrorMiddleware],
        functionMiddleware: [funcErrorMiddleware],
        serializationAdapters: [
            formZodErrorAdapter,
            formattedErrorAdapter,
        ],
    }
});
