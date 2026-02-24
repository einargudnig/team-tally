import { Hono } from "hono";

export const routes = new Hono().get("/", (c) => {
  return c.json({
    message: "Welcome to the API",
  });
});
