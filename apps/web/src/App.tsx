import { useEffect, useState } from "react";
import { api } from "./api";
import type { User } from "@team-tally/shared";

function App() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Type-safe API call!
    api.users["123"].get().then((response: any) => {
      if (response.data?.user) setUser(response.data.user);
    });
  }, []);

  const createUser = async () => {
    const response = await api.users.post({
      name: "Jane Doe",
      email: "jane@example.com",
    });
    console.log(response.data);
  };

  return (
    <div>
      <h1>User: {user?.name}</h1>
      <button onClick={createUser}>Create User</button>
    </div>
  );
}

export default App;
