const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function loadHelper() {
  const module = { exports: {} };
  const code = ts.transpileModule(
    fs.readFileSync(path.resolve("src/features/account-packages/registration.ts"), "utf8"),
    { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }
  ).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id === "expo-linking") return { openURL: async () => undefined };
      if (id === "@/features/account-packages/api") return { accountPackageApi: { subscribe: async () => ({}) } };
      if (id === "@/features/account-packages/storage") return { saveSubscriptionCheckout: async () => undefined };
      throw new Error(`unexpected import ${id}`);
    },
  });
  return module.exports.subscribeAfterRegistration;
}

const paid = {
  subscriptionId: "s1",
  checkoutUrl: "https://pay.test/checkout/1",
  orderCode: 123,
  amount: 50000,
};

function deps(overrides = {}) {
  const calls = [];
  return {
    calls,
    deps: {
      subscribe: async (planId) => {
        calls.push(["subscribe", planId]);
        return paid;
      },
      saveCheckout: async (userId, payment) => calls.push(["save", userId, payment.subscriptionId]),
      openUrl: async (url) => calls.push(["open", url]),
      ...overrides,
    },
  };
}

test("no chosen package does nothing", async () => {
  const subscribeAfterRegistration = loadHelper();
  const { calls, deps: d } = deps();
  assert.equal(await subscribeAfterRegistration("u1", null, d), "skipped");
  assert.equal(await subscribeAfterRegistration("u1", undefined, d), "skipped");
  assert.deepEqual(calls, []);
});

test("a free plan is activated and no payment page is opened", async () => {
  const subscribeAfterRegistration = loadHelper();
  const { calls, deps: d } = deps({
    subscribe: async (planId) => {
      calls.push(["subscribe", planId]);
      return { subscriptionId: "s0", checkoutUrl: "", orderCode: 0, amount: 0, activated: true };
    },
  });
  assert.equal(await subscribeAfterRegistration("u1", "plan-free", d), "activated");
  assert.deepEqual(calls, [["subscribe", "plan-free"]]);
});

test("a paid plan saves the checkout before opening the payment page", async () => {
  const subscribeAfterRegistration = loadHelper();
  const { calls, deps: d } = deps();
  assert.equal(await subscribeAfterRegistration("u1", "plan-paid", d), "payment-opened");
  assert.deepEqual(calls, [
    ["subscribe", "plan-paid"],
    ["save", "u1", "s1"],
    ["open", paid.checkoutUrl],
  ]);
});

test("an invalid checkout is never opened or saved", async () => {
  const subscribeAfterRegistration = loadHelper();
  for (const bad of [
    { ...paid, checkoutUrl: "javascript:alert(1)" },
    { ...paid, amount: 0 },
    { ...paid, amount: 1.5 },
  ]) {
    const { calls, deps: d } = deps({ subscribe: async () => bad });
    assert.equal(await subscribeAfterRegistration("u1", "plan-paid", d), "failed");
    assert.deepEqual(calls, []);
  }
});

test("failures never throw so registration is not affected", async () => {
  const subscribeAfterRegistration = loadHelper();
  const failing = [
    { subscribe: async () => { throw new Error("network"); } },
    { saveCheckout: async () => { throw new Error("storage"); } },
    { openUrl: async () => { throw new Error("no browser"); } },
  ];
  for (const override of failing) {
    const { deps: d } = deps(override);
    assert.equal(await subscribeAfterRegistration("u1", "plan-paid", d), "failed");
  }
});
