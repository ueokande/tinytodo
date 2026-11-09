import "./global.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App.tsx";

const root = document.getElementById("app");
if (!root) throw new Error("App root missing");
createRoot(root).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
