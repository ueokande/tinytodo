import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { basePath } from "./scripts/base-path.ts";
export default defineConfig({ base: basePath, plugins: [react()] });
