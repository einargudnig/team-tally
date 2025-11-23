import { Elysia, t } from "elysia";

// Mock data (replace with DB later)
const usersDb = new Map([
  ["1", { id: "1", name: "John Doe", email: "john@example.com" }],
  ["2", { id: "2", name: "Jane Smith", email: "jane@example.com" }],
]);

export const users = new Elysia({ prefix: "/users" })
  // GET /api/users - List all users
  .get("/", () => {
    return { users: Array.from(usersDb.values()) };
  })

  // GET /api/users/:id - Get single user
  .get(
    "/:id",
    ({ params: { id }, error }) => {
      const user = usersDb.get(id);

      if (!user) {
        return error(404, { message: "User not found" });
      }

      return { user };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  )

  // POST /api/users - Create user
  .post(
    "/",
    ({ body }) => {
      const id = String(usersDb.size + 1);
      const newUser = { id, ...body };

      usersDb.set(id, newUser);

      return {
        message: "User created",
        user: newUser,
      };
    },
    {
      body: t.Object({
        name: t.String({ minLength: 2 }),
        email: t.String({ format: "email" }),
      }),
    },
  )

  // PUT /api/users/:id - Update user
  .put(
    "/:id",
    ({ params: { id }, body, error }) => {
      const user = usersDb.get(id);

      if (!user) {
        return error(404, { message: "User not found" });
      }

      const updatedUser = { ...user, ...body };
      usersDb.set(id, updatedUser);

      return {
        message: "User updated",
        user: updatedUser,
      };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
      body: t.Object({
        name: t.Optional(t.String({ minLength: 2 })),
        email: t.Optional(t.String({ format: "email" })),
      }),
    },
  )

  // DELETE /api/users/:id - Delete user
  .delete(
    "/:id",
    ({ params: { id }, error }) => {
      const user = usersDb.get(id);

      if (!user) {
        return error(404, { message: "User not found" });
      }

      usersDb.delete(id);

      return { message: "User deleted" };
    },
    {
      params: t.Object({
        id: t.String(),
      }),
    },
  );
