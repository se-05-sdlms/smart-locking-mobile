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
    "@/features/account-packages/registration": { subscribeAfterRegistration: async () => "skipped" },
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
