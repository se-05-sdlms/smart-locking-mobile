/* global __dirname */
const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
const component = (name) => Object.assign(() => {}, { displayName: name });
const Button = Object.assign(component("Button"), { Label: component("Button.Label") });
const Card = Object.assign(component("Card"), { Body: component("Card.Body") });
const fixture = (kind, id = "A") =>
  kind === "retrieval"
    ? {
        id,
        status: "Stored",
        parcelCode: `PARCEL-${id}`,
        compartmentCode: "01",
        lockerCode: "LKR-A",
      }
    : {
        id,
        status: 0,
        imageUrl: "https://example.test/image.jpg",
        lockerCode: `LOCKER-${id}`,
        lockerAddress: "Address",
        canCancel: true,
      };

// Render the actual screen functions with deterministic hooks and mocked native/UI boundaries.
// Async API outcomes and rendered callbacks remain real; no source-text assertions.
function screen(kind, get) {
  const slots = [],
    pendingEffects = [],
    timers = new Set();
  let updates = 0;
  let cursor = 0,
    tree,
    queued = false,
    mounted = true,
    focused = true,
    id = "A",
    activeListener;
  const calls = { get: [], unlock: [], cancel: [], alerts: [] };
  const same = (a, b) => a && b && a.length === b.length && a.every((v, i) => Object.is(v, b[i]));
  const schedule = () => {
    if (!mounted || queued) return;
    queued = true;
    queueMicrotask(() => {
      queued = false;
      if (mounted) render();
    });
  };
  function effect(fn, deps, focus = false) {
    const index = cursor++;
    const old = slots[index];
    if (old && same(old.deps, deps)) return;
    const slot = { deps, cleanup: old?.cleanup, focus };
    slots[index] = slot;
    pendingEffects.push(() => {
      slot.cleanup?.();
      slot.cleanup = !focus || focused ? fn() : undefined;
    });
  }
  const react = {
    useState(initial) {
      const index = cursor++;
      slots[index] ??= { value: typeof initial === "function" ? initial() : initial };
      return [
        slots[index].value,
        (next) => {
          const value = typeof next === "function" ? next(slots[index].value) : next;
          if (!Object.is(value, slots[index].value)) {
            updates++;
            slots[index].value = value;
            schedule();
          }
        },
      ];
    },
    useRef(initial) {
      const index = cursor++;
      slots[index] ??= { current: initial };
      return slots[index];
    },
    useCallback(fn, deps) {
      const index = cursor++;
      if (!same(slots[index]?.deps, deps)) slots[index] = { deps, value: fn };
      return slots[index].value;
    },
    useEffect: effect,
  };
  const api = {
    get: async (value) => {
      calls.get.push(value);
      return get(value, calls.get.length);
    },
    getDetail: async (value) => {
      calls.get.push(value);
      return get(value, calls.get.length);
    },
    unlockPickup: async (value) => {
      calls.unlock.push(value);
      return { result: "Succeeded", accessEventId: "event" };
    },
    allocateAndOpen: async (value) => {
      calls.unlock.push(value);
    },
    cancel: async (value) => {
      calls.cancel.push(value);
      throw new Error("Cancellation needs verification");
    },
  };
  const tag = (type, props) =>
    typeof type === "function" && !type.displayName
      ? type(props || {})
      : { type, props: props || {} };
  class ApiError extends Error {}
  const imports = {
    react,
    "react/jsx-runtime": { jsx: tag, jsxs: tag, Fragment: "Fragment" },
    "expo-router": {
      router: { replace() {}, push() {} },
      useLocalSearchParams: () => ({ id, parcelId: id }),
      useFocusEffect: (fn) => effect(fn, [fn], true),
    },
    "heroui-native": {
      Button,
      Card,
      Skeleton: component("Skeleton"),
      Spinner: component("Spinner"),
      Typography: { Paragraph: component("Paragraph"), Heading: component("Heading") },
    },
    "react-native": {
      View: component("View"),
      ScrollView: component("ScrollView"),
      Alert: { alert: (...args) => calls.alerts.push(args) },
      AppState: {
        addEventListener: (_event, fn) => {
          activeListener = fn;
          return {
            remove: () => {
              activeListener = null;
            },
          };
        },
      },
      Share: { share: async () => {} },
    },
    "@/components/ui/themed-safe-area-view": { SafeAreaView: component("SafeAreaView") },
    "@/components/ui/parcel-image": { ParcelImage: component("ParcelImage") },
    "@/components/icons/gravity-icon": { GravityIcon: component("GravityIcon") },
    "@/components/ui/resident-ui": {
      FlowSteps: component("FlowSteps"),
      IncidentAction: component("IncidentAction"),
      ScreenHeader: component("ScreenHeader"),
    },
    "@/components/ui/action-error": { ActionError: component("ActionError") },
    "@/features/support/locker-support-card": { LockerSupportCard: component("LockerSupportCard") },
    "@/features/parcels/api": { parcelApi: api },
    "@/features/returns/api": { returnApi: api },
    "@/lib/api-client": { ApiError },
  };
  const module = { exports: {} };
  const source =
    kind === "retrieval"
      ? "app/(resident)/retrieval/[parcelId].tsx"
      : "app/(resident)/returns/[id].tsx";
  vm.runInNewContext(
    ts.transpileModule(readFileSync(path.join(__dirname, "../src", source), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      Error,
      require: (name) => {
        if (name in imports) return imports[name];
        throw new Error(`Unexpected import ${name}`);
      },
      setTimeout: (fn, ms) => {
        const timer = setTimeout(() => {
          timers.delete(timer);
          if (mounted) fn();
        }, ms);
        timers.add(timer);
        return timer;
      },
      clearTimeout,
      setInterval: (fn) => ({ fn }),
      clearInterval() {},
    }
  );
  function render() {
    cursor = 0;
    tree = module.exports.default();
    while (pendingEffects.length) pendingEffects.shift()();
  }
  function nodes(value, found = []) {
    if (Array.isArray(value)) value.forEach((child) => nodes(child, found));
    else if (value && typeof value === "object") {
      found.push(value);
      nodes(value.props?.children, found);
    }
    return found;
  }
  const text = (value) =>
    typeof value === "string" || typeof value === "number"
      ? String(value)
      : Array.isArray(value)
        ? value.map(text).join(" ")
        : value
          ? text(value.props?.children)
          : "";
  render();
  return {
    calls,
    updates: () => updates,
    text: () => text(tree),
    find: (name) => nodes(tree).filter((node) => node.type?.displayName === name),
    button: (label) =>
      nodes(tree).find((node) => node.type === Button && text(node).includes(label)),
    activate: () => activeListener?.("active"),
    changeId(next) {
      id = next;
      render();
    },
    blur() {
      focused = false;
      for (const slot of slots)
        if (slot?.focus) {
          slot.cleanup?.();
          slot.cleanup = undefined;
          slot.deps = undefined;
        }
    },
    focus() {
      focused = true;
      render();
    },
    unmount() {
      mounted = false;
      for (const slot of slots) slot?.cleanup?.();
      for (const timer of timers) clearTimeout(timer);
    },
    async flush() {
      await new Promise((resolve) => setTimeout(resolve, 0));
      await new Promise((resolve) => setImmediate(resolve));
    },
  };
}

for (const kind of ["retrieval", "return"]) {
  test(`${kind}: completed GET cannot update an unmounted screen`, { timeout: 5000 }, async () => {
    const response = deferred();
    const h = screen(kind, () => response.promise);
    await h.flush();
    h.unmount();
    const updates = h.updates();
    response.resolve(fixture(kind));
    await h.flush();
    assert.equal(h.updates(), updates);
  });

  test(
    `${kind}: initial failure stops loading; retry is busy, deduplicated and recovers`,
    { timeout: 5000 },
    async (t) => {
      const retry = deferred();
      const h = screen(kind, (_id, attempt) =>
        attempt === 1 ? Promise.reject(new Error("Offline")) : retry.promise
      );
      t.after(() => h.unmount());
      await h.flush();
      assert.equal(h.calls.get.length, 1);
      assert.equal(h.find("Spinner").length + h.find("Skeleton").length, 0);
      const error = h.find("ActionError")[0];
      assert.ok(error, "Initial load error must provide retry");
      assert.equal(error.props.message, "Offline");
      assert.equal(error.props.busy, false);
      assert.equal(h.button(kind === "retrieval" ? "Mở ngăn" : "Tìm ngăn"), undefined);
      error.props.onRetry();
      error.props.onRetry();
      h.activate();
      await h.flush();
      assert.equal(h.calls.get.length, 2);
      assert.equal(h.find("ActionError")[0].props.busy, true);
      assert.equal(h.calls.unlock.length, 0);
      retry.resolve(fixture(kind));
      await h.flush();
      assert.equal(h.find("ActionError").length, 0);
      assert.equal(h.find("Spinner").length + h.find("Skeleton").length, 0);
      assert.ok(h.button(kind === "retrieval" ? "Mở ngăn" : "Tìm ngăn"));
    }
  );

  test(`${kind}: another failed retry remains recoverable`, { timeout: 5000 }, async (t) => {
    const h = screen(kind, () => Promise.reject(new Error("Server unavailable")));
    t.after(() => h.unmount());
    await h.flush();
    h.find("ActionError")[0].props.onRetry();
    await h.flush();
    assert.equal(h.calls.get.length, 2);
    assert.equal(h.find("ActionError")[0].props.busy, false);
    assert.equal(h.find("Spinner").length + h.find("Skeleton").length, 0);
  });

  test(
    `${kind}: late previous-ID response cannot replace current detail`,
    { timeout: 5000 },
    async (t) => {
      const old = deferred(),
        next = deferred();
      const h = screen(kind, (id) => (id === "A" ? old.promise : next.promise));
      t.after(() => h.unmount());
      await h.flush();
      h.changeId("B");
      await h.flush();
      assert.equal(h.button(kind === "retrieval" ? "Mở ngăn" : "Tìm ngăn"), undefined);
      next.resolve(fixture(kind, "B"));
      await h.flush();
      old.resolve(fixture(kind, "A"));
      await h.flush();
      assert.ok(h.text().includes(kind === "retrieval" ? "PARCEL-B" : "LOCKER-B"));
      assert.ok(!h.text().includes(kind === "retrieval" ? "PARCEL-A" : "LOCKER-A"));
    }
  );
}

test(
  "return: cancellation keeps pickup code hidden through failed load and retry",
  { timeout: 5000 },
  async (t) => {
    const stored = { ...fixture("return"), status: 2, pickupCode: "654321", compartmentCode: "01" };
    const h = screen("return", (_id, attempt) =>
      attempt === 1 ? stored : Promise.reject(new Error("Offline"))
    );
    t.after(() => h.unmount());
    await h.flush();
    assert.ok(h.text().includes("654321"));
    h.button("Hủy yêu cầu").props.onPress();
    h.calls.alerts[0][2].find((action) => action.style === "destructive").onPress();
    await h.flush();
    assert.ok(!h.text().includes("654321"));
    h.button("Kiểm tra lại trạng thái").props.onPress();
    await h.flush();
    assert.ok(!h.text().includes("654321"));
    assert.equal(h.find("ActionError")[0].props.busy, false);
    assert.equal(h.find("Spinner").length, 0);
  }
);
