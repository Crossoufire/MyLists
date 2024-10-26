import "./index.css";
import App from "@/app";
import ReactDOM, {Container} from "react-dom/client";


const rootElement = document.getElementById("root");
if (!rootElement.innerHTML) {
    const root = ReactDOM.createRoot(rootElement as Container);
    root.render(<App/>);
}
