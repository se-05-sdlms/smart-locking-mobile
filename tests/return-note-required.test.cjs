const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const { test } = require("node:test");
const ts = require("typescript");

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};
function load(file, imports) {
  const module = { exports: {} };
  vm.runInNewContext(
    ts.transpileModule(readFileSync(path.join(__dirname, "../src", file), "utf8"), {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2022,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    {
      module,
      exports: module.exports,
      require: (name) => {
        assert.ok(name in imports, `Unexpected import ${name}`);
        return imports[name];
      },
      Error,
    }
  );
  return module.exports;
}

function screen() {
  const slots = [];
  let cursor = 0,
    tree;
  const uploads = [],
    creates = [],
    routes = [];
  const component = (name) => name;
  const ui = new Proxy(
    {
      Button: { Label: "Button.Label" },
      Card: { Body: "Card.Body" },
      Typography: { Paragraph: "Paragraph" },
    },
    { get: (target, name) => target[name] ?? component(name) }
  );
  const render = () => {
    cursor = 0;
    tree = Screen();
  };
  const { default: Screen } = load("app/(resident)/returns/new.tsx", {
    react: {
      useState(initial) {
        const i = cursor++;
        slots[i] ??= { value: initial };
        return [
          slots[i].value,
          (value) => {
            slots[i].value = value;
          },
        ];
      },
      useRef(initial) {
        const i = cursor++;
        slots[i] ??= { current: initial };
        return slots[i];
      },
    },
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "expo-image-picker": {
      getCameraPermissionsAsync: async () => ({ granted: true }),
      launchCameraAsync: async () => ({ canceled: false, assets: [{ uri: "file://photo.jpg" }] }),
    },
    "expo-router": { router: { replace: (route) => routes.push(route) } },
    "heroui-native": ui,
    "react-native": { Linking: {}, ScrollView: "ScrollView", View: "View" },
    "@/components/ui/resident-form": { ResidentForm: "ResidentForm" },
    "@/components/ui/parcel-image": { ParcelImage: "ParcelImage" },
    "@/components/ui/themed-safe-area-view": { SafeAreaView: "SafeAreaView" },
    "@/components/ui/action-error": { ActionError: "ActionError" },
    "@/components/icons/gravity-icon": { GravityIcon: "GravityIcon" },
    "@/components/ui/resident-ui": { FlowSteps: "FlowSteps", ScreenHeader: "ScreenHeader" },
    "@/features/returns/api": {
      returnApi: {
        uploadImage(uri) {
          const response = deferred();
          uploads.push({ uri, response });
          return response.promise;
        },
        create(...args) {
          const response = deferred();
          creates.push({ args, response });
          return response.promise;
        },
      },
    },
  });
  function nodes(node, result = []) {
    if (Array.isArray(node)) node.forEach((child) => nodes(child, result));
    else if (node && typeof node === "object") {
      result.push(node);
      nodes(node.props?.children, result);
    }
    return result;
  }
  render();
  return {
    uploads,
    creates,
    routes,
    render,
    find: (type) => nodes(tree).filter((node) => node.type === type),
    async photo() {
      await nodes(tree)
        .find((node) => node.type === ui.Button)
        .props.onPress();
      await this.flush();
    },
    note(value) {
      nodes(tree)
        .find((node) => node.type === "TextArea")
        .props.onChangeText(value);
      render();
    },
    submit() {
      return nodes(tree)
        .filter((node) => node.type === ui.Button)
        .at(-1)
        .props.onPress();
    },
    async flush() {
      for (let i = 0; i < 6; i++) await Promise.resolve();
      render();
    },
  };
}

test("actual screen rejects empty/whitespace notes before uploading, with accessible field error", async () => {
  const h = screen();
  await h.photo();
  for (const note of ["", " \t\n "]) {
    h.note(note);
    h.submit();
    await h.flush();
    assert.equal(h.uploads.length, 0);
    assert.equal(h.creates.length, 0);
    assert.equal(h.find("TextField")[0].props.isInvalid, true);
    const error = h.find("FieldError").find((node) => node.props.children.includes("ghi chú"));
    assert.equal(error.props.textProps.accessibilityRole, "alert");
    assert.equal(h.find("TextArea")[0].props.maxLength, 200);
    assert.match(h.find("TextArea")[0].props.accessibilityLabel, /bắt buộc/);
  }
  h.note("Sách");
  assert.equal(h.find("TextField")[0].props.isInvalid, false);
});

test("actual screen trims note, blocks duplicate submit and retains photo/note/upload cache for retry", async () => {
  const h = screen();
  await h.photo();
  h.note("  Sách gửi trả  ");
  h.submit();
  h.submit();
  assert.equal(h.uploads.length, 1);
  h.uploads[0].response.resolve("https://example.test/photo.jpg");
  await h.flush();
  assert.deepEqual(h.creates[0].args, ["https://example.test/photo.jpg", "Sách gửi trả"]);
  h.creates[0].response.reject(new Error("Mất kết nối"));
  await h.flush();
  assert.equal(h.find("ParcelImage")[0].props.uri, "file://photo.jpg");
  assert.equal(h.find("TextArea")[0].props.value, "  Sách gửi trả  ");
  h.find("ActionError")[0].props.onRetry();
  await h.flush();
  assert.equal(h.uploads.length, 1);
  assert.equal(h.creates.length, 2);
  h.creates[1].response.resolve({ id: "return-1" });
  await h.flush();
  assert.equal(h.routes[0].params.id, "return-1");
});

test("actual screen upload error retains input and retries upload before create", async () => {
  const h = screen();
  await h.photo();
  h.note("Hộp sách");
  h.submit();
  h.uploads[0].response.reject(new Error("Tải ảnh thất bại"));
  await h.flush();
  assert.equal(h.creates.length, 0);
  assert.equal(h.find("TextArea")[0].props.value, "Hộp sách");
  h.find("ActionError")[0].props.onRetry();
  assert.equal(h.uploads.length, 2);
  h.uploads[1].response.resolve("https://example.test/retry.jpg");
  await h.flush();
  assert.equal(h.creates.length, 1);
});

test("actual return API rejects blank notes without HTTP and sends trimmed authenticated body", async () => {
  const calls = [];
  const { returnApi } = load("features/returns/api.ts", {
    "expo-file-system": { File: class {} },
    "@/lib/api-client": {
      apiRequest: async (...args) => {
        calls.push(args);
        return { id: "return" };
      },
    },
  });
  for (const note of ["", " \t\n "])
    await assert.rejects(returnApi.create("image", note), /ghi chú/);
  assert.equal(calls.length, 0);
  await returnApi.create("image", "  Hộp sách  ");
  assert.equal(calls[0][0], "/returns");
  assert.equal(calls[0][1].authenticated, true);
  assert.deepEqual(JSON.parse(calls[0][1].body), { imageUrl: "image", note: "Hộp sách" });
});
