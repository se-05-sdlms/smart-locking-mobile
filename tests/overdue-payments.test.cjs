const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");
function load(file, imports = {}) {
  const module = { exports: {} };
  const code = ts.transpileModule(
    readFileSync(path.join(__dirname, "../src/features/payments", file), "utf8"),
    {
      compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
    }
  ).outputText;
  vm.runInNewContext(code, { module, exports: module.exports, URL, require: (id) => imports[id] });
  return module.exports;
}
test("overdue checkout, detail and history call the resident API contract", async () => {
  const calls = [];
  const api = load("api.ts", {
    "@/lib/api-client": {
      apiRequest: async (url, options) => {
        calls.push({ url, options });
        return [];
      },
    },
  }).paymentApi;
  await api.create("charge");
  await api.get("transaction");
  await api.getHistory();
  assert.equal(calls[0].url, "/overdue-payments/charges/charge/checkout");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.authenticated, true);
  assert.equal(calls[1].url, "/overdue-payments/transaction");
  assert.equal(calls[2].url, "/overdue-payments");
});
test("only confirmed Success is paid; failed and cancelled never appear pending", () => {
  const { paymentState } = load("types.ts");
  for (const status of [1, "Success"]) assert.equal(paymentState(status).success, true);
  for (const status of [0, "Pending", 2, "Failed", 3, "Cancelled"])
    assert.equal(paymentState(status).success, false);
  for (const status of [2, "Failed", 3, "Cancelled"])
    assert.equal(paymentState(status).pending, false);
});
test("checkout opens HTTPS links and rejects missing or unsafe schemes", () => {
  const { checkoutUrl } = load("types.ts");
  assert.equal(checkoutUrl("https://pay.payos.vn/example"), "https://pay.payos.vn/example");
  for (const url of [null, "", "javascript:alert(1)", "file:///tmp/x", "http://example.test"])
    assert.throws(() => checkoutUrl(url));
});
