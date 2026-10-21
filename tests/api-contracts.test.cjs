const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

function loadApi(file, name) {
  const calls = [];
  const module = { exports: {} };
  const code = ts.transpileModule(fs.readFileSync(path.join(__dirname, "../src", file), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) => {
      assert.equal(id, "@/lib/api-client");
      return {
        apiRequest: async (url, options) => {
          calls.push({ url, options });
          return [];
        },
        pageItems: (result) => result,
      };
    },
  });
  return { api: module.exports[name], calls };
}

test("registration, approval mode, and pickup use backend routes and request bodies", async () => {
  const auth = loadApi("features/auth/api.ts", "authApi");
  await auth.api.getRegistrationLockers();
  assert.equal(auth.calls[0].url, "/auth/registration-lockers");
  const delivery = loadApi("features/delivery-requests/api.ts", "deliveryRequestApi");
  await delivery.api.updateApprovalMode(1);
  assert.equal(delivery.calls[0].url, "/residents/me/approval-mode");
  assert.equal(delivery.calls[0].options.method, "PUT");
  assert.deepEqual(JSON.parse(delivery.calls[0].options.body), { deliveryApprovalMode: 1 });
  const parcels = loadApi("features/parcels/api.ts", "parcelApi");
  await parcels.api.unlockPickup("parcel");
  assert.equal(parcels.calls[0].url, "/parcels/parcel/unlock-pickup");
  assert.equal(parcels.calls[0].options.method, "POST");
});

test("notification array contract avoids fictitious pagination and uses read endpoints", async () => {
  const { api, calls } = loadApi("features/notifications/api.ts", "notificationApi");
  assert.ok(Array.isArray(await api.getPage()));
  await api.getAll(true);
  await api.markRead("notification");
  await api.markAllRead();
  assert.equal(calls[0].url, "/notifications?limit=100");
  assert.equal(calls[1].url, "/notifications?unreadOnly=true&limit=100");
  assert.equal(calls[2].url, "/notifications/notification/read");
  assert.equal(calls[2].options.method, "PATCH");
  assert.equal(calls[3].url, "/notifications/read-all");
  assert.equal(calls[3].options.method, "PATCH");
});
