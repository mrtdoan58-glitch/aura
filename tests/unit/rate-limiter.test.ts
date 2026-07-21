import { describe, it, expect } from "vitest";
import { InMemoryRateLimiter } from "@/server/rate-limit/rate-limiter";

describe("InMemoryRateLimiter (sliding window)", () => {
  it("allows up to the limit then blocks", async () => {
    const t = 1000;
    const rl = new InMemoryRateLimiter(3, 1000, () => t);
    expect((await rl.consume("k")).allowed).toBe(true);
    expect((await rl.consume("k")).allowed).toBe(true);
    expect((await rl.consume("k")).allowed).toBe(true);
    expect((await rl.consume("k")).allowed).toBe(false);
  });

  it("recovers after the window passes", async () => {
    let t = 0;
    const rl = new InMemoryRateLimiter(1, 1000, () => t);
    expect((await rl.consume("k")).allowed).toBe(true);
    expect((await rl.consume("k")).allowed).toBe(false);
    t = 1500;
    expect((await rl.consume("k")).allowed).toBe(true);
  });

  it("tracks keys independently", async () => {
    const rl = new InMemoryRateLimiter(1, 1000);
    expect((await rl.consume("a")).allowed).toBe(true);
    expect((await rl.consume("b")).allowed).toBe(true);
  });
});
