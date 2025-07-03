import {createRouter} from "@/router";
import {hydrateRoot} from "react-dom/client";
import {StartClient} from "@tanstack/react-start";


const router = createRouter();


hydrateRoot(document, <StartClient router={router}/>);
