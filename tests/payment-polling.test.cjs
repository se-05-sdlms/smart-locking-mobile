const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

test("payment polling checks on foreground and stops when the screen loses focus", async () => {
  const module = { exports: {} };
  let focus;
  let onAppState;
  let nextCheck;
  const appState = {
    currentState: "active",
    addEventListener: (_, listener) => {
      onAppState = listener;
      return {
        remove: () => {
          onAppState = undefined;
        },
      };
    },
  };
  const code = ts.transpileModule(
    fs.readFileSync("src/features/payments/use-payment-polling.ts", "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS } }
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) =>
      ({
        "expo-router": {
          useFocusEffect: (callback) => {
            focus = callback;
          },
        },
        react: { useCallback: (callback) => callback },
        "react-native": { AppState: appState },
      })[id],
    setTimeout: (callback) => {
      nextCheck = callback;
      return 1;
    },
    clearTimeout: () => {
      nextCheck = undefined;
    },
  });

  let checks = 0;
  module.exports.usePaymentPolling(true, async () => {
    checks++;
  });
  const cleanup = focus();
  nextCheck();
  await new Promise(setImmediate);
  assert.equal(checks, 1);
  onAppState("background");
  assert.equal(nextCheck, undefined);
  onAppState("active");
  await new Promise(setImmediate);
  assert.equal(checks, 2);
  cleanup();
  assert.equal(onAppState, undefined);
  assert.equal(nextCheck, undefined);
});
