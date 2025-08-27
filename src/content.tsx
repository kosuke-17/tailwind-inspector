import { createRoot } from "react-dom/client";
import { App } from "./App";

// ReactアプリケーションをDOMにマウント
const container = document.createElement("div");
container.id = "ti-react-root";
document.documentElement.appendChild(container);

const root = createRoot(container);
root.render(<App />);
