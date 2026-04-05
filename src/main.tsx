import { createRoot } from "react-dom/client";
import App from "./app/App.tsx";
import "./styles/index.css";

// CI Test: Added comment to test GitHub Actions workflow
createRoot(document.getElementById("root")!).render(<App />);
