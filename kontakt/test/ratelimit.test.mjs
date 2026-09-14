import assert from "node:assert/strict";
import { test } from "node:test";
import { createRateLimiter } from "../lib/ratelimit.mjs";

test("begrenzt je Schlüssel im Zeitfenster", () => {
  const limiter = createRateLimiter({ limit: 2, windowMs: 1000 });
  assert.equal(limiter.allow("a", 0), true);
  assert.equal(limiter.allow("a", 10), true);
  assert.equal(limiter.allow("a", 20), false);
  assert.equal(limiter.allow("b", 20), true);
  assert.equal(limiter.allow("a", 1100), true);
});
