/* global __dirname */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

function load(file, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(readFileSync(path.join(__dirname, "../src", file), "utf8"), {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      jsx: ts.JsxEmit.ReactJSX,
    },
  }).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    URL,
    require: (id) => {
      if (id in imports) return imports[id];
      throw new Error(`Unexpected import ${id}`);
    },
  });
  return module.exports;
}

test("profile rejects impossible/future dates, blank names and invalid image URLs", () => {
  const { profileErrors } = load("features/account/validation.ts");
  assert.equal(
    Object.keys(profileErrors("Cường", "2004-01-09", "https://example.test/me.jpg")).length,
    0
  );
  for (const date of ["2023-02-29", "2099-01-01", "2020-13-01", "bad"]) {
    assert.ok(profileErrors("Cường", date, "").dateOfBirth);
  }
  assert.ok(profileErrors(" ", "", "javascript:alert(1)").fullName);
  assert.ok(profileErrors("Cường", "", "javascript:alert(1)").avatarUrl);
});

test("password validation requires current, minimum length, new value and confirmation", () => {
  const { passwordErrors } = load("features/account/validation.ts");
  assert.ok(passwordErrors("", "12345678", "12345678").current);
  assert.ok(passwordErrors("old", "short", "short").next);
  assert.ok(passwordErrors("12345678", "12345678", "12345678").next);
  assert.ok(passwordErrors("old", "12345678", "different").confirm);
  assert.equal(Object.keys(passwordErrors("old", "12345678", "12345678")).length, 0);
});

function authHarness(failingStep) {
  const calls = [];
  const react = {
    createContext: () => ({ Provider: "Provider" }),
    useEffect: () => {},
    useMemo: (fn) => fn(),
    useState: () => [null, () => {}],
    useContext: () => null,
  };
  const step = (name, result) => async () => {
    calls.push(name);
    if (failingStep === name) throw new Error(name);
    return result;
  };
  const session = { refreshToken: "rotated", user: { role: "Resident" } };
  const mod = load("features/auth/auth-context.tsx", {
    react,
    "react/jsx-runtime": { jsx: (_, props) => props },
    "@/features/account-packages/registration": {
      subscribeAfterRegistration: async () => "skipped",
    },
    "@/features/account-packages/storage": {},
    "@/features/auth/api": {
      authApi: { logout: step("revoke"), changePassword: step("change", session) },
    },
    "@/features/auth/storage": {
      readSession: step("read", session),
      clearSession: step("clear"),
      saveSession: step("save"),
    },
    "@/features/notifications/push": { deactivatePushInstallation: step("deactivate") },
    "@/lib/api-client": {},
  });
  return { auth: mod.AuthProvider({ children: null }).value, calls };
}

test("logout deactivates push and revokes token before deleting credentials", async () => {
  const h = authHarness();
  await h.auth.logout();
  assert.deepEqual(h.calls, ["deactivate", "read", "revoke", "clear"]);
  for (const step of ["deactivate", "revoke"]) {
    const failed = authHarness(step);
    await assert.rejects(failed.auth.logout());
    assert.ok(!failed.calls.includes("clear"));
  }
});

test("password change persists the rotated session", async () => {
  const h = authHarness();
  await h.auth.changePassword("old", "new");
  assert.deepEqual(h.calls, ["change", "save"]);
});

function restorationHarness(outcome) {
  const values = [],
    effects = [];
  let start, finish;
  const started = new Promise((resolve) => {
    start = resolve;
  });
  const response = new Promise((resolve) => {
    finish = resolve;
  });
  class ApiError extends Error {
    constructor(status, code) {
      super(code);
      this.status = status;
      this.code = code;
    }
  }
  const A = { refreshToken: "A-refresh", user: { id: "A", role: "Resident" } };
  const B = { refreshToken: "B-refresh", user: { id: "B", role: "Resident" } };
  let stored = A,
    revision = 0,
    clears = 0;
  const current = (source) => source.revision === revision;
  const clear = async () => {
    revision++;
    stored = null;
    clears++;
  };
  const mod = load("features/auth/auth-context.tsx", {
    react: {
      createContext: () => ({ Provider: "Provider" }),
      useEffect: (effect) => effects.push(effect),
      useMemo: (fn) => fn(),
      useState: (initial) => {
        const index = values.length;
        values.push(initial);
        return [
          initial,
          (next) => {
            values[index] = next;
          },
        ];
      },
      useContext: () => null,
    },
    "react/jsx-runtime": { jsx: (_, props) => props },
    "@/features/account-packages/registration": {},
    "@/features/account-packages/storage": {},
    "@/features/auth/api": {
      authApi: {
        me: async () => {
          start();
          await response;
          if (outcome !== "success")
            throw new ApiError(
              outcome === "unauthorized" ? 401 : outcome === "cancelled" ? 409 : 0,
              outcome === "cancelled" ? "auth/session_changed" : "test/error"
            );
          return A.user;
        },
        login: async () => B,
        logout: async () => {},
      },
    },
    "@/features/auth/storage": {
      readSession: async () => stored,
      readSessionSnapshot: async () => ({ revision, session: stored }),
      isSessionCurrent: current,
      saveSession: async (next) => {
        revision++;
        stored = next;
      },
      clearSession: clear,
      clearSessionIfCurrent: async (source) => {
        if (!current(source) || stored?.refreshToken !== source.session?.refreshToken) return null;
        await clear();
        return revision;
      },
    },
    "@/features/notifications/push": { deactivatePushInstallation: async () => {} },
    "@/lib/api-client": { ApiError, onSessionExpired: () => () => {} },
  });
  const auth = mod.AuthProvider({ children: null }).value;
  effects[0]();
  return { auth, started, finish, values, stored: () => stored, clears: () => clears };
}

for (const outcome of ["success", "network", "unauthorized", "cancelled"]) {
  test(
    `old restoration ${outcome} cannot replace or clear the new login's UI`,
    { timeout: 5000 },
    async () => {
      const h = restorationHarness(outcome);
      await h.started;
      await h.auth.login("B", "password");
      h.finish();
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(h.stored().user.id, "B");
      assert.equal(h.values[1].id, "B");
      assert.equal(h.values[0], false);
      assert.equal(h.clears(), 0);
    }
  );
}

test(
  "restoration finishing after logout cannot resurrect its cached user",
  { timeout: 5000 },
  async () => {
    const h = restorationHarness("success");
    await h.started;
    await h.auth.logout();
    h.finish();
    await new Promise((resolve) => setImmediate(resolve));
    assert.equal(h.stored(), null);
    assert.equal(h.values[1], null);
  }
);

for (const outcome of ["success", "network", "unauthorized"]) {
  test(
    `unchanged session restoration keeps existing ${outcome} behavior`,
    { timeout: 5000 },
    async () => {
      const h = restorationHarness(outcome);
      await h.started;
      h.finish();
      await new Promise((resolve) => setImmediate(resolve));
      assert.equal(h.values[0], false);
      if (outcome === "unauthorized") {
        assert.equal(h.values[1], null);
        assert.equal(h.stored(), null);
        assert.equal(h.clears(), 1);
      } else {
        assert.equal(h.values[1].id, "A");
        assert.equal(h.stored().user.id, "A");
        assert.equal(h.clears(), 0);
      }
    }
  );
}
