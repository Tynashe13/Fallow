// Loads Playwright from the project or from a global install (NODE_PATH).
// Playwright is not a project dependency: install it yourself to run the checks
// locally (npm i -D playwright && npx playwright install chromium).
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
export const { chromium } = require("playwright");
