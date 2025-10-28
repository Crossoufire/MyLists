import {createStart} from "@tanstack/react-start";
import {errorMiddleware} from "@/lib/server/middlewares/global-error";
import {formattedErrorAdapter, formZodErrorAdapter} from "@/lib/utils/error-classes";


export const startInstance = createStart(() => {
    return {
        defaultSsr: false,
        functionMiddleware: [errorMiddleware],
        serializationAdapters: [
            formZodErrorAdapter,
            formattedErrorAdapter,
        ],
    }
});
