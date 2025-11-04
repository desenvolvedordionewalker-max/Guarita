import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import "./responsive.css";
import "./hide-vercel-toolbar.css";

createRoot(document.getElementById("root")!).render(<App />);
