import dotenv from "dotenv";
import {createRouter} from "@/router";
import {createStartHandler, defaultStreamHandler} from "@tanstack/react-start/server";


dotenv.config();


export default createStartHandler({ createRouter })(defaultStreamHandler);
