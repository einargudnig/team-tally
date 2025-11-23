import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";

const app = new Elysia()
  .use(cors())
  .get("/", () => "Hello from Elysia!")
  .get(
    "/users/:id",
    ({ params: { id } }) => ({
      id,
      name: "John Doe",
    }),
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )
  .post(
    "/users",
    ({ body }) => ({
      success: true,
      user: body,
    }),
    {
      body: t.Object({
        name: t.String(),
        email: t.String(),
      }),
    },
  )
  .listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);

export type App = typeof app;
