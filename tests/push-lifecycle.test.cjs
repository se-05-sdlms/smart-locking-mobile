const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function harness(api) {
  const stored = new Map();
  const module = { exports: {} };
  class ApiError extends Error {
    constructor(status) {
      super("request failed");
      this.status = status;
    }
  }
  const imports = {
    "expo-application": { getAndroidId: () => "device" },
    "expo-constants": { default: {} },
    "expo-device": { isDevice: true },
    "expo-notifications": {
      setNotificationHandler: () => {},
      setNotificationChannelAsync: async () => {},
      AndroidImportance: { HIGH: 4 },
      getPermissionsAsync: async () => ({ status: "granted" }),
      getExpoPushTokenAsync: async () => ({ data: "ExpoPushToken[test]" }),
    },
    "expo-secure-store": {
      setItemAsync: async (key, value) => stored.set(key, value),
      getItemAsync: async (key) => stored.get(key),
      deleteItemAsync: async (key) => stored.delete(key),
    },
    "react-native": { Platform: { OS: "android" } },
    "@/config/env": { ENV: { EAS_PROJECT_ID: "project" } },
    "@/features/notifications/api": { notificationApi: api },
    "@/lib/api-client": { ApiError },
  };
  const code = ts.transpileModule(
    readFileSync(path.join(__dirname, "../src/features/notifications/push.ts"), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }
  ).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, require: (id) => imports[id] });
  return { push: module.exports, stored, ApiError };
}

test("logout waits for in-flight registration before deactivation", async () => {
  const calls = [];
  let release;
  const gate = new Promise((resolve) => {
    release = resolve;
  });
  const h = harness({
    registerDevice: async () => {
      calls.push("register");
      await gate;
    },
    deactivateDevice: async () => {
      calls.push("deactivate");
    },
  });
  const registering = h.push.registerPushInstallation();
  const logout = h.push.deactivatePushInstallation();
  await new Promise((resolve) => setImmediate(resolve));
  assert.deepEqual(calls, ["register"]);
  assert.equal(h.stored.size, 1);
  release();
  await registering;
  await logout;
  assert.deepEqual(calls, ["register", "deactivate"]);
  assert.equal(h.stored.size, 0);
});

test("a lost registration response retains device ID for cleanup; failed cleanup can retry", async () => {
  let failing = true;
  const h = harness({
    registerDevice: async () => {
      throw new Error("lost response");
    },
    deactivateDevice: async () => {
      if (failing) throw new Error("offline");
    },
  });
  await assert.rejects(h.push.registerPushInstallation());
  await assert.rejects(h.push.deactivatePushInstallation());
  assert.equal(h.stored.size, 1);
  failing = false;
  await h.push.deactivatePushInstallation();
  assert.equal(h.stored.size, 0);
});
