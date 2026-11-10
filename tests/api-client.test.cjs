/* global __dirname */
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
  let persisted = JSON.stringify(initial);
  let clears = 0;
  let expirations = 0;
  const delays = {};
  const secureStore = {
    WHEN_UNLOCKED_THIS_DEVICE_ONLY: "device-only",
    getItemAsync: async () => {
      const value = persisted;
      await delays.read?.();
      return value;
    },
    setItemAsync: async (_key, value) => {
      await delays.write?.(JSON.parse(value));
      persisted = value;
    },
    deleteItemAsync: async () => {
      await delays.delete?.();
      persisted = null;
      clears++;
    },
  };
  const storageModule = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(
      readFileSync(path.join(__dirname, "../src/features/auth/storage.ts"), "utf8"),
      { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
    ).outputText,
    {
      module: storageModule,
      exports: storageModule.exports,
      require: (id) => {
        if (id === "expo-secure-store") return secureStore;
        throw new Error(`Unexpected storage import: ${id}`);
      },
    }
  );
  const storage = storageModule.exports;
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
    session: () => (persisted ? JSON.parse(persisted) : null),
    setSession: (next) => (next ? storage.saveSession(next) : storage.clearSession()),
    delays,
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
        ? json({ code: "auth/invalid_refresh_token", detail: "Invalid refresh token." }, status)
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

test("ProblemDetails maps codes to Vietnamese and retains field errors", async () => {
  const h = harness(async () =>
    json(
      {
        code: "auth/invalid_otp",
        detail: "Invalid OTP.",
        errors: { otpCode: ["Invalid OTP."] },
      },
      400
    )
  );
  await assert.rejects(h.client.apiRequest("/auth/register"), (error) => {
    assert.equal(error.code, "auth/invalid_otp");
    assert.equal(error.message, "Mã OTP không đúng hoặc đã hết hạn.");
    assert.deepEqual(Array.from(error.errors.otpCode), ["Invalid OTP."]);
    return true;
  });
});

test("unrecognized ProblemDetails retains detail; malformed responses remain usable", async () => {
  for (const body of [{ code: "future/error", detail: "Thông báo từ máy chủ" }, null]) {
    const h = harness(async () => json(body, 409));
    await assert.rejects(h.client.apiRequest("/parcels"), (error) => {
      assert.equal(error.status, 409);
      assert.equal(error.message, body?.detail ?? "Yêu cầu không thể thực hiện.");
      return true;
    });
  }
});

test("unrelated validation failure during refresh does not clear the session", async () => {
  const h = harness(async (url) =>
    url.endsWith("/auth/refresh-token")
      ? json({ code: "validation/invalid_input", detail: "Invalid input" }, 400)
      : json({}, 401)
  );
  await assert.rejects(
    h.client.apiRequest("/parcels", { authenticated: true }),
    (error) => error.code === "validation/invalid_input"
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

function deferred() {
  let resolve;
  const promise = new Promise((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
const otherSession = {
  accessToken: "other-access",
  refreshToken: "other-refresh",
  user: { id: "other-resident", role: "Resident" },
};
const sessionChanged = (error) => error.code === "auth/session_changed";

for (const rejected of [false, true]) {
  for (const next of [otherSession, null, { ...initial }]) {
    test(
      `late refresh ${rejected ? "rejection" : "success"} preserves replacement ${next?.user.id ?? "logout"}`,
      { timeout: 5000 },
      async () => {
        const started = deferred(),
          response = deferred();
        let protectedCalls = 0;
        const h = harness(async (url) => {
          if (url.endsWith("/auth/refresh-token")) {
            started.resolve();
            return response.promise;
          }
          protectedCalls++;
          return json({}, 401);
        });
        const pending = assert.rejects(
          h.client.apiRequest("/parcels", { authenticated: true }),
          sessionChanged
        );
        await started.promise;
        await h.setSession(next);
        response.resolve(
          rejected ? json({ code: "auth/invalid_refresh_token" }, 400) : json(renewed)
        );
        await pending;
        assert.deepEqual(h.session(), next);
        assert.equal(protectedCalls, 1);
        assert.equal(h.clears(), next ? 0 : 1);
        assert.equal(h.expirations(), 0);
      }
    );
  }
}

for (const retry of [true, false]) {
  test(
    `a delayed 401 ends the old request after account change (retry=${retry})`,
    { timeout: 5000 },
    async () => {
      const started = deferred(),
        response = deferred();
      const authorizations = [];
      const h = harness(async (_url, options) => {
        authorizations.push(options.headers.get("Authorization"));
        started.resolve();
        return authorizations.length === 1 ? response.promise : json({ unexpectedRetry: true });
      });
      const pending = assert.rejects(
        h.client.apiRequest("/parcels", { authenticated: true, retry }),
        sessionChanged
      );
      await started.promise;
      await h.setSession(otherSession);
      response.resolve(json({}, 401));
      await pending;
      assert.deepEqual(authorizations, ["Bearer old-access"]);
      assert.deepEqual(h.session(), otherSession);
    }
  );
}

test(
  "new session has its own refresh; old completion cannot reset its single flight",
  { timeout: 5000 },
  async () => {
    const oldStarted = deferred(),
      newStarted = deferred();
    const oldResponse = deferred(),
      newResponse = deferred();
    const next = {
      ...otherSession,
      accessToken: "other-rotated-access",
      refreshToken: "other-rotated-refresh",
    };
    let refreshes = 0;
    const h = harness(async (url, options) => {
      if (url.endsWith("/auth/refresh-token")) {
        refreshes++;
        if (JSON.parse(options.body).refreshToken === initial.refreshToken) {
          oldStarted.resolve();
          return oldResponse.promise;
        }
        newStarted.resolve();
        return newResponse.promise;
      }
      return options.headers.get("Authorization") === `Bearer ${next.accessToken}`
        ? json({ ok: true })
        : json({}, 401);
    });
    const old = assert.rejects(
      h.client.apiRequest("/parcels", { authenticated: true }),
      sessionChanged
    );
    await oldStarted.promise;
    await h.setSession(otherSession);
    const first = h.client.apiRequest("/parcels", { authenticated: true });
    await newStarted.promise;
    oldResponse.resolve(json(renewed));
    await old;
    const second = h.client.apiRequest("/parcels", { authenticated: true });
    await new Promise((resolve) => setImmediate(resolve));
    newResponse.resolve(json(next));
    await Promise.all([first, second]);
    assert.equal(refreshes, 2);
    assert.deepEqual(h.session(), next);
  }
);

for (const rejected of [false, true]) {
  test(
    `session change during storage check blocks refresh ${rejected ? "deletion" : "save"}`,
    { timeout: 5000 },
    async () => {
      const started = deferred(),
        response = deferred(),
        checking = deferred(),
        release = deferred();
      const h = harness(async (url) => {
        if (!url.endsWith("/auth/refresh-token")) return json({}, 401);
        started.resolve();
        return response.promise;
      });
      const pending = assert.rejects(
        h.client.apiRequest("/parcels", { authenticated: true }),
        sessionChanged
      );
      await started.promise;
      h.delays.read = async () => {
        checking.resolve();
        await release.promise;
      };
      response.resolve(
        rejected ? json({ code: "auth/invalid_refresh_token" }, 400) : json(renewed)
      );
      await checking.promise;
      const replacement = h.setSession(otherSession);
      h.delays.read = undefined;
      release.resolve();
      await Promise.all([pending, replacement]);
      assert.deepEqual(h.session(), otherSession);
      assert.equal(h.clears(), 0);
      assert.equal(h.expirations(), 0);
    }
  );
  test(
    `pending native storage ${rejected ? "delete" : "write"} cannot undo new login`,
    { timeout: 5000 },
    async () => {
      const writing = deferred(),
        release = deferred();
      const h = harness(async (url) =>
        url.endsWith("/auth/refresh-token")
          ? rejected
            ? json({ code: "auth/invalid_refresh_token" }, 401)
            : json(renewed)
          : json({}, 401)
      );
      const pause = async () => {
        writing.resolve();
        await release.promise;
      };
      if (rejected) h.delays.delete = pause;
      else
        h.delays.write = async (next) => {
          if (next.refreshToken === renewed.refreshToken) await pause();
        };
      const pending = assert.rejects(
        h.client.apiRequest("/parcels", { authenticated: true }),
        sessionChanged
      );
      await writing.promise;
      const replacement = h.setSession(otherSession);
      release.resolve();
      await Promise.all([pending, replacement]);
      assert.deepEqual(h.session(), otherSession);
      assert.equal(h.expirations(), 0);
    }
  );
}

test(
  "login queued before a pending session read starts cannot relabel the old token",
  { timeout: 5000 },
  async () => {
    const authorizations = [];
    const h = harness(async (_url, options) => {
      authorizations.push(options.headers.get("Authorization"));
      return json({ ok: true });
    });
    const pending = assert.rejects(
      h.client.apiRequest("/parcels", { authenticated: true }),
      sessionChanged
    );
    const replacement = h.setSession(otherSession);
    await Promise.all([pending, replacement]);
    assert.deepEqual(authorizations, []);
    assert.deepEqual(h.session(), otherSession);
  }
);
