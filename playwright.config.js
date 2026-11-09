import {defineConfig} from '@playwright/test';
export default defineConfig({testDir:'./e2e',use:{baseURL:'http://localhost:4173',launchOptions:{executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH || undefined},viewport:{width:393,height:851}},webServer:{command:'npm run build && npm run preview -- --port 4173',url:'http://localhost:4173',reuseExistingServer:false}});
