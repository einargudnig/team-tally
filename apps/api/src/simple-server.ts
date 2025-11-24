// Mock data (replace with DB later)
const usersDb = new Map([
  ["1", { id: "1", name: "John Doe", email: "john@example.com" }],
  ["2", { id: "2", name: "Jane Smith", email: "jane@example.com" }],
]);

const app = Bun.serve({
  port: 3000,
  fetch(req) {
    const url = new URL(req.url);
    
    // CORS headers
    const corsHeaders = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    };
    
    // Handle preflight requests
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    
    // Health check
    if (url.pathname === "/health") {
      return Response.json({ 
        status: "ok", 
        timestamp: new Date().toISOString() 
      }, { headers: corsHeaders });
    }
    
    // Users API
    if (url.pathname.startsWith("/api/users")) {
      const userId = url.pathname.split("/")[3];
      
      // GET /api/users - List all users
      if (req.method === "GET" && !userId) {
        return Response.json({ users: Array.from(usersDb.values()) }, { 
          headers: corsHeaders 
        });
      }
      
      // GET /api/users/:id - Get single user
      if (req.method === "GET" && userId) {
        const user = usersDb.get(userId);
        if (!user) {
          return Response.json({ error: "User not found" }, { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        return Response.json({ user }, { headers: corsHeaders });
      }
      
      // POST /api/users - Create user
      if (req.method === "POST" && !userId) {
        return req.json().then((body: any) => {
          const id = String(usersDb.size + 1);
          const newUser = { id, ...body };
          usersDb.set(id, newUser);
          return Response.json({
            message: "User created",
            user: newUser,
          }, { headers: corsHeaders });
        }).catch(() => {
          return Response.json({ error: "Invalid JSON" }, { 
            status: 400, 
            headers: corsHeaders 
          });
        });
      }
      
      // PUT /api/users/:id - Update user
      if (req.method === "PUT" && userId) {
        const user = usersDb.get(userId);
        if (!user) {
          return Response.json({ error: "User not found" }, { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        
        return req.json().then((body: any) => {
          const updatedUser = { ...user, ...body };
          usersDb.set(userId, updatedUser);
          return Response.json({
            message: "User updated",
            user: updatedUser,
          }, { headers: corsHeaders });
        }).catch(() => {
          return Response.json({ error: "Invalid JSON" }, { 
            status: 400, 
            headers: corsHeaders 
          });
        });
      }
      
      // DELETE /api/users/:id - Delete user
      if (req.method === "DELETE" && userId) {
        const user = usersDb.get(userId);
        if (!user) {
          return Response.json({ error: "User not found" }, { 
            status: 404, 
            headers: corsHeaders 
          });
        }
        
        usersDb.delete(userId);
        return Response.json({ message: "User deleted" }, { 
          headers: corsHeaders 
        });
      }
    }
    
    // 404 for unknown routes
    return Response.json({ error: "Route not found" }, { 
      status: 404, 
      headers: corsHeaders 
    });
  },
});

console.log(`🦊 Server running at http://localhost:${app.port}`);
console.log(`📚 Health check at http://localhost:${app.port}/health`);
console.log(`👥 Users API at http://localhost:${app.port}/api/users`);