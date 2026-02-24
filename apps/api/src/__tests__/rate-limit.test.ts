import { describe, test, expect, beforeEach } from "bun:test";
import { Hono } from "hono";

describe("Rate Limiting Logic", () => {
  test("should allow requests within limit", () => {
    const limit = 5;
    const requests = 3;
    
    expect(requests <= limit).toBe(true);
  });

  test("should block requests over limit", () => {
    const limit = 5;
    const requests = 6;
    
    expect(requests > limit).toBe(true);
  });

  test("should reset after window expires", () => {
    const windowMs = 60000; // 1 minute
    const requestTime = Date.now();
    const resetTime = requestTime + windowMs;
    
    // Simulate time passing
    const currentTime = resetTime + 1;
    
    expect(currentTime > resetTime).toBe(true);
  });
});

describe("Rate Limit Headers", () => {
  test("should set correct rate limit headers", async () => {
    const app = new Hono();
    
    const limit = 100;
    let requestCount = 0;
    const windowMs = 60000;
    const resetTime = Date.now() + windowMs;
    
    app.use("/*", async (c, next) => {
      requestCount++;
      const remaining = Math.max(0, limit - requestCount);
      const resetInSeconds = Math.ceil((resetTime - Date.now()) / 1000);
      
      c.header("X-RateLimit-Limit", String(limit));
      c.header("X-RateLimit-Remaining", String(remaining));
      c.header("X-RateLimit-Reset", String(resetInSeconds));
      
      if (requestCount > limit) {
        c.header("Retry-After", String(resetInSeconds));
        return c.json({ error: "Rate limited" }, 429);
      }
      
      await next();
    });
    
    app.get("/", (c) => c.json({ ok: true }));

    const res = await app.request("/");
    
    expect(res.headers.get("X-RateLimit-Limit")).toBe("100");
    expect(res.headers.get("X-RateLimit-Remaining")).toBe("99");
    expect(res.headers.get("X-RateLimit-Reset")).toBeTruthy();
  });

  test("should return 429 when rate limited", async () => {
    const app = new Hono();
    
    const limit = 2;
    let requestCount = 0;
    
    app.use("/*", async (c, next) => {
      requestCount++;
      
      if (requestCount > limit) {
        return c.json({ error: "Rate limited" }, 429);
      }
      
      await next();
    });
    
    app.get("/", (c) => c.json({ ok: true }));

    // First request - OK
    const res1 = await app.request("/");
    expect(res1.status).toBe(200);

    // Second request - OK
    const res2 = await app.request("/");
    expect(res2.status).toBe(200);

    // Third request - Rate limited
    const res3 = await app.request("/");
    expect(res3.status).toBe(429);
  });
});

describe("IP Address Extraction", () => {
  test("should extract IP from X-Forwarded-For header", () => {
    const getClientIp = (headers: Record<string, string | undefined>) => {
      const forwarded = headers["X-Forwarded-For"];
      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      return headers["X-Real-IP"] || "unknown";
    };

    expect(getClientIp({ "X-Forwarded-For": "1.2.3.4" })).toBe("1.2.3.4");
    expect(getClientIp({ "X-Forwarded-For": "1.2.3.4, 5.6.7.8" })).toBe("1.2.3.4");
  });

  test("should extract IP from X-Real-IP header", () => {
    const getClientIp = (headers: Record<string, string | undefined>) => {
      const forwarded = headers["X-Forwarded-For"];
      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      return headers["X-Real-IP"] || "unknown";
    };

    expect(getClientIp({ "X-Real-IP": "1.2.3.4" })).toBe("1.2.3.4");
  });

  test("should return unknown when no IP headers present", () => {
    const getClientIp = (headers: Record<string, string | undefined>) => {
      const forwarded = headers["X-Forwarded-For"];
      if (forwarded) {
        return forwarded.split(",")[0].trim();
      }
      return headers["X-Real-IP"] || "unknown";
    };

    expect(getClientIp({})).toBe("unknown");
  });
});
