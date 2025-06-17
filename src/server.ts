import dotenv from "dotenv";
import {createRouter} from "@/router";
import {initializeContainer} from "@/lib/server/core/container";
import {createStartHandler, defaultStreamHandler} from "@tanstack/react-start/server";


dotenv.config();


const initializedContainer = await initializeContainer();
globalThis.__MY_APP_CONTAINER = initializedContainer;


export default createStartHandler({ createRouter })(defaultStreamHandler);
