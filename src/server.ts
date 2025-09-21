import {createRouter} from "@/router";
import {createStartHandler, defaultStreamHandler} from "@tanstack/react-start/server";


export default createStartHandler({ createRouter })(defaultStreamHandler);
