const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const initial = {
  accessToken: "old-access",
  refreshToken: "old-refresh",
  user: { id: "resident", role: "Resident" },
};
const renewed = { ...initial, accessToken: "new-access", refreshToken: "new-refresh" };
const json = (body, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });

// Exercise the real client with fake transport and SecureStore, without a native runtime.
function harness(transport, timeout = 1000) {
  let session = { ...initial };
  let clears = 0;
  let expirations = 0;
  const storage = {
    readSession: async () => session,
    saveSession: async (next) => {
      session = next;
    },
    clearSession: async () => {
      session = null;
      clears++;
    },
  };
  const module = { exports: {} };
  const source = readFileSync(path.join(__dirname, "../src/lib/api-client.ts"), "utf8");
  const code = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    Headers,
    FormData,
    AbortController,
    setTimeout,
    clearTimeout,
    fetch: transport,
    require: (id) => {
      if (id === "@/config/env")
        return { ENV: { API_URL: "https://example.test/api", API_TIMEOUT: timeout } };
      if (id === "@/features/auth/storage") return storage;
      if (id === "@/lib/text-encoding-diagnostics") return { diagnoseApiText: () => {} };
      throw new Error(`Unexpected import: ${id}`);
    },
  });
  module.exports.onSessionExpired(() => {
    expirations++;
  });
  return {
    client: module.exports,
    session: () => session,
    clears: () => clears,
    expirations: () => expirations,
  };
}

test("successful refresh rotates persisted tokens and retries the original request", async () => {
  let refreshes = 0;
  const h = harness(async (url, options) => {
    if (url.endsWith("/auth/refresh-token")) {
      refreshes++;
      assert.equal(JSON.parse(options.body).refreshToken, "old-refresh");
      return json(renewed);
    }
    return options.headers.get("Authorization") === "Bearer new-access"
      ? json({ ok: true })
      : json({}, 401);
  });
  assert.deepEqual(await h.client.apiRequest("/parcels", { authenticated: true }), { ok: true });
  assert.equal(h.session().refreshToken, "new-refresh");
  assert.equal(refreshes, 1);
  assert.equal(h.clears(), 0);
});

for (const status of [401, 403, 400]) {
  test(`explicit refresh rejection (${status}) expires the session`, async () => {
    const h = harness(async (url) =>
      url.endsWith("/auth/refresh-token")
        ? json({ message: "Invalid refresh token." }, status)
        : json({}, 401)
    );
    await assert.rejects(
      h.client.apiRequest("/parcels", { authenticated: true }),
      (error) => error.status === 401
    );
    assert.equal(h.session(), null);
    assert.equal(h.clears(), 1);
    assert.equal(h.expirations(), 1);
  });
}

test("network failure during refresh preserves the session and remains retryable", async () => {
  let offline = true;
  const h = harness(async (url, options) => {
    if (url.endsWith("/auth/refresh-token")) {
      if (offline) throw new TypeError("offline");
      return json(renewed);
    }
    return options.headers.get("Authorization") === "Bearer new-access"
      ? json({ ok: true })
      : json({}, 401);
  });
  await assert.rejects(
    h.client.apiRequest("/parcels", { authenticated: true }),
    (error) => error.status === 0 && error.retryable
  );
  assert.equal(h.session().refreshToken, "old-refresh");
  assert.equal(h.clears(), 0);
  assert.equal(h.expirations(), 0);
  offline = false;
  await h.client.apiRequest("/parcels", { authenticated: true });
  assert.equal(h.session().refreshToken, "new-refresh");
});

test("refresh timeout preserves the session", async () => {
  const h = harness(async (url, options) => {
    if (!url.endsWith("/auth/refresh-token")) return json({}, 401);
    return new Promise((resolve, reject) =>
      options.signal.addEventListener("abort", () => reject(new Error("aborted")), { once: true })
    );
  }, 10);
  await assert.rejects(
    h.client.apiRequest("/parcels", { authenticated: true }),
    (error) => error.status === 0 && error.retryable
  );
  assert.equal(h.clears(), 0);
});

test("server failure during refresh preserves the session", async () => {
  const h = harness(async (url) => json({}, url.endsWith("/auth/refresh-token") ? 503 : 401));
  await assert.rejects(
    h.client.apiRequest("/parcels", { authenticated: true }),
    (error) => error.status === 503 && error.retryable
  );
  assert.equal(h.clears(), 0);
});

test("concurrent 401 requests share one refresh", async () => {
  let refreshes = 0;
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const h = harness(async (url, options) => {
    if (url.endsWith("/auth/refresh-token")) {
      refreshes++;
      await gate;
      return json(renewed);
    }
    return options.headers.get("Authorization") === "Bearer new-access"
      ? json({ ok: true })
      : json({}, 401);
  });
  const requests = Array.from({ length: 8 }, () =>
    h.client.apiRequest("/parcels", { authenticated: true })
  );
  // Let all original responses join the refresh before releasing its result.
  await new Promise((resolve) => setImmediate(resolve));
  release();
  await Promise.all(requests);
  assert.equal(refreshes, 1);
  assert.equal(h.clears(), 0);
});

test("a late 401 from an old access token reuses the already refreshed session", async () => {
  let refreshes = 0;
  let releaseLate;
  const late = new Promise((resolve) => {
    releaseLate = resolve;
  });
  const h = harness(async (url, options) => {
    if (url.endsWith("/auth/refresh-token")) {
      refreshes++;
      return json(renewed);
    }
    if (options.headers.get("Authorization") === "Bearer new-access") return json({ ok: true });
    if (url.endsWith("/late")) await late;
    return json({}, 401);
  });
  const pending = h.client.apiRequest("/late", { authenticated: true });
  await h.client.apiRequest("/first", { authenticated: true });
  releaseLate();
  await pending;
  assert.equal(refreshes, 1);
});
