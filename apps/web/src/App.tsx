import { useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "@team-tally/shared";

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Type-safe API call!
    api.users["123"].get().then(({ data }) => {
      if (data) setUser(data);
    });
  }, []);

  const createUser = async () => {
    const { data } = await api.users.post({
      name: "Jane Doe",
      email: "jane@example.com",
    });
    console.log(data);
  };

  return (
    <div>
      <h1>User: {user?.name}</h1>
      <button onClick={createUser}>Create User</button>
    </div>
  );
}

export default App;
