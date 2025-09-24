import {createStart} from "@tanstack/react-start";
import {errorMiddleware} from "@/lib/server/middlewares/global-error";


export const startInstance = createStart(() => {
    return {
        functionMiddleware: [errorMiddleware],
    }
})
