import { Elysia } from "elysia";

export const routes = new Elysia().get("/", () => ({
  message: "Welcome to the API",
}));
