import { edenTreaty } from "@elysiajs/eden";
import type { App } from "@team-tally/api";

export const api = edenTreaty<App>("http://localhost:3000");
