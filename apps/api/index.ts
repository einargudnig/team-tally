import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { users } from "./routes/users.js";

const app = new Elysia()
  .use(cors())
  .use(
    swagger({
      documentation: { info: { title: "Team Tally API", version: "1.0.0" } },
    }),
  )
  .onError(({ code, error, set }) => {
    if (code === "NOT_FOUND") {
      set.status = 404;
      return { error: "Route not found" };
    }

    if (code === "VALIDATION") {
      set.status = 400;
      return { error: "Validation failed", details: error.message };
    }

    set.status = 500;
    return { error: "Internal Server Error" };
  })
  .get("/health", () => ({
    status: "ok",
    timestamp: new Date().toISOString(),
  }))
  .group("/api", (app) => app.use(users))
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
console.log(`📚 Swagger docs at http://localhost:3000/swagger`);

// Export type for Eden treaty
export type App = typeof app;
