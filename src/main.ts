import "./style.css";
import { mountApp } from "./app.ts";

const root = document.querySelector<HTMLElement>("#app");
if (!root) throw new Error("App root missing");
mountApp(root);
