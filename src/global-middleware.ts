import {registerGlobalMiddleware} from "@tanstack/react-start";
import {errorMiddleware} from "@/lib/server/middlewares/global-error";


registerGlobalMiddleware({
    middleware: [errorMiddleware],
})
