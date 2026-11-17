const assert = require("node:assert/strict");
const { readFileSync } = require("node:fs");
const path = require("node:path");
const { test, describe } = require("node:test");
const vm = require("node:vm");
const ts = require("typescript");

// ---------------------------------------------------------------------------
// Helpers & isolated transpiler loader for pure unit testing
// ---------------------------------------------------------------------------

const deferred = () => {
  let resolve, reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
};

function loadModule(relativePath, imports = {}) {
  const module = { exports: {} };
  const fullPath = path.join(__dirname, "../src", relativePath);
  const source = readFileSync(fullPath, "utf8");

  const isTsx = relativePath.endsWith(".tsx");
  const compilerOptions = {
    module: ts.ModuleKind.CommonJS,
    target: ts.ScriptTarget.ES2022,
  };
  if (isTsx) {
    compilerOptions.jsx = ts.JsxEmit.ReactJSX;
  }

  const code = ts.transpileModule(source, { compilerOptions }).outputText;

  vm.runInNewContext(code, {
    module,
    exports: module.exports,
    require: (id) => {
      if (id in imports) return imports[id];
      throw new Error(`Unexpected import in test loader: ${id}`);
    },
    Error,
    Date,
    JSON,
    setTimeout,
    clearTimeout,
    Headers,
    FormData,
    Response,
    fetch: imports.__fetch || fetch,
    AbortController,
  });

  return module.exports;
}

function collectNodes(node, acc = []) {
  if (Array.isArray(node)) {
    node.forEach((child) => collectNodes(child, acc));
  } else if (node && typeof node === "object") {
    acc.push(node);
    collectNodes(node.props?.children, acc);
  }
  return acc;
}

// ---------------------------------------------------------------------------
// 1. Terms / Privacy consent gate & validation
// ---------------------------------------------------------------------------

function setupRegisterHarness(overrides = {}) {
  const slots = [];
  let cursor = 0;
  let tree = null;
  const routes = [];
  let pendingRegistration = null;
  const otpRequests = [];

  const react = {
    useState(initial) {
      const i = cursor++;
      slots[i] ??= { value: typeof initial === "function" ? initial() : initial };
      return [
        slots[i].value,
        (next) => {
          slots[i].value = typeof next === "function" ? next(slots[i].value) : next;
        },
      ];
    },
    useRef(initial) {
      const i = cursor++;
      slots[i] ??= { current: initial };
      return slots[i];
    },
    useEffect(fn) {
      const i = cursor++;
      slots[i] ??= { ran: false };
      if (!slots[i].ran) {
        slots[i].ran = true;
        fn();
      }
    },
  };

  const makeComponent = (name) => Object.assign((props) => props, { displayName: name });
  const ui = new Proxy(
    {
      Button: Object.assign(makeComponent("Button"), { Label: makeComponent("Button.Label") }),
      LinkButton: Object.assign(makeComponent("LinkButton"), { Label: makeComponent("LinkButton.Label") }),
      Checkbox: Object.assign(makeComponent("Checkbox"), { Indicator: makeComponent("Checkbox.Indicator") }),
      Select: Object.assign(makeComponent("Select"), {
        Trigger: makeComponent("Select.Trigger"),
        Value: makeComponent("Select.Value"),
        TriggerIndicator: makeComponent("Select.TriggerIndicator"),
        Portal: makeComponent("Select.Portal"),
        Overlay: makeComponent("Select.Overlay"),
        Content: makeComponent("Select.Content"),
        Item: makeComponent("Select.Item"),
        ItemLabel: makeComponent("Select.ItemLabel"),
        ItemDescription: makeComponent("Select.ItemDescription"),
        ItemIndicator: makeComponent("Select.ItemIndicator"),
      }),
      Typography: Object.assign(makeComponent("Typography"), {
        Paragraph: makeComponent("Paragraph"),
        Heading: makeComponent("Heading"),
      }),
      Label: makeComponent("Label"),
    },
    { get: (target, name) => target[name] ?? makeComponent(name) }
  );

  const authApiMock = {
    getRegistrationLockers: async () => [
      { id: "locker-1", code: "L01", address: "123 Main St" },
    ],
    requestRegistrationOtp: async (phone) => {
      otpRequests.push(phone);
      if (overrides.otpError) throw overrides.otpError;
    },
    ...overrides.authApi,
  };

  const screensModule = loadModule("features/auth/screens.tsx", {
    react,
    "react/jsx-runtime": {
      jsx: (type, props) => ({ type, props }),
      jsxs: (type, props) => ({ type, props }),
    },
    "heroui-native": ui,
    "react-native": { View: "View", ScrollView: "ScrollView" },
    "expo-router": {
      router: {
        push: (r) => routes.push({ action: "push", route: r }),
        replace: (r) => routes.push({ action: "replace", route: r }),
      },
      useLocalSearchParams: () => ({}),
    },
    "@/components/auth/auth-field": { AuthField: makeComponent("AuthField") },
    "@/components/auth/auth-screen": { AuthScreen: makeComponent("AuthScreen") },
    "@/components/icons/gravity-icon": { GravityIcon: makeComponent("GravityIcon") },
    "@/features/account-packages/api": {
      accountPackageApi: { getPlans: async () => [] },
    },
    "@/features/account-packages/package-picker": { PackagePicker: makeComponent("PackagePicker") },
    "@/features/auth/api": { authApi: authApiMock },
    "@/features/auth/auth-context": {
      useAuth: () => ({
        setPendingRegistration: (payload) => {
          pendingRegistration = payload;
        },
      }),
    },
    "@/features/legal/content": { LEGAL_VERSION: "1.0" },
  });

  const render = () => {
    cursor = 0;
    tree = screensModule.RegisterScreen();
    return tree;
  };

  render();

  const isType = (n, name) => n.type === name || n.type?.displayName === name;
  const findNodes = (predicate) =>
    collectNodes(tree).filter(typeof predicate === "string" ? (n) => isType(n, predicate) : predicate);

  return {
    render,
    getTree: () => tree,
    allNodes: () => collectNodes(tree),
    findNodes,
    routes,
    otpRequests,
    getPendingRegistration: () => pendingRegistration,
    setOtpError: (err) => {
      overrides.otpError = err;
    },
    setFullName(val) {
      findNodes((n) => isType(n, "AuthField") && n.props?.label === "Họ và tên")[0].props.onChangeText(val);
      render();
    },
    setPhone(val) {
      findNodes((n) => isType(n, "AuthField") && n.props?.label === "Số điện thoại")[0].props.onChangeText(val);
      render();
    },
    setPassword(val) {
      findNodes((n) => isType(n, "AuthField") && n.props?.label === "Mật khẩu")[0].props.onChangeText(val);
      render();
    },
    setConfirm(val) {
      findNodes((n) => isType(n, "AuthField") && n.props?.label === "Xác nhận mật khẩu")[0].props.onChangeText(val);
      render();
    },
    setLocker(item) {
      findNodes("Select")[0].props.onValueChange(item);
      render();
    },
    clickTerms() {
      findNodes((n) => n.props?.accessibilityLabel === "Đọc điều khoản sử dụng")[0].props.onPress();
      render();
    },
    clickPrivacy() {
      findNodes((n) => n.props?.accessibilityLabel === "Đọc chính sách bảo mật")[0].props.onPress();
      render();
    },
    acceptConsent(val = true) {
      findNodes("Checkbox")[0].props.onSelectedChange(val);
      render();
    },
    async submit() {
      const btn = findNodes((n) => isType(n, "Button") && n.props?.size === "lg")[0];
      btn.props.onPress();
      render();
      // Allow async submit() execution to complete inside microtasks/timers
      await new Promise((r) => setTimeout(r, 60));
      render();
    },
  };
}

describe("Terms & Privacy legal consent gate & validation", () => {
  test("checkbox is disabled until both Terms and Privacy links have been opened", () => {
    const h = setupRegisterHarness();

    const getCheckbox = () => h.findNodes("Checkbox")[0];
    const getSubmitButton = () => h.findNodes((n) => n.type?.displayName === "Button" && n.props?.size === "lg")[0];

    // 1. Initial state: neither document viewed
    assert.equal(getCheckbox().props.isDisabled, true);
    assert.equal(getSubmitButton().props.isDisabled, true);

    // 2. Open only Terms
    h.clickTerms();
    assert.equal(h.routes[0].route, "/legal/terms");
    assert.equal(getCheckbox().props.isDisabled, true, "Checkbox must remain disabled when only Terms is viewed");
    assert.equal(getSubmitButton().props.isDisabled, true);

    // 3. Open Privacy as well
    h.clickPrivacy();
    assert.equal(h.routes[1].route, "/legal/privacy");
    assert.equal(getCheckbox().props.isDisabled, false, "Checkbox must become enabled when both documents are viewed");
    assert.equal(getSubmitButton().props.isDisabled, true, "Submit button must still be disabled before checking consent");
  });

  test("submit button is enabled only after consent checkbox is accepted", () => {
    const h = setupRegisterHarness();

    const getCheckbox = () => h.findNodes("Checkbox")[0];
    const getSubmitButton = () => h.findNodes((n) => n.type?.displayName === "Button" && n.props?.size === "lg")[0];

    // Open both documents
    h.clickTerms();
    h.clickPrivacy();

    // Checkbox is enabled, now toggle accepted
    h.acceptConsent(true);
    assert.equal(getCheckbox().props.isSelected, true);
    assert.equal(getSubmitButton().props.isDisabled, false, "Submit button should be enabled after consent accepted");

    // Unchecking disables submit again
    h.acceptConsent(false);
    assert.equal(getSubmitButton().props.isDisabled, true);
  });

  test("registration submit builds valid versioned UTC ISO 8601 consent payload", async () => {
    const h = setupRegisterHarness();

    // Fill valid fields
    h.setFullName("Trần Minh Cường");
    h.setPhone("0912 345 678");
    h.setPassword("ValidPass123");
    h.setConfirm("ValidPass123");
    h.setLocker({ value: "locker-1", label: "Tủ 1" });

    // Open legal docs & accept consent
    h.clickTerms();
    h.clickPrivacy();
    h.acceptConsent(true);

    const beforeSubmit = Date.now();
    await h.submit();
    const afterSubmit = Date.now();

    assert.deepEqual(h.otpRequests, ["0912345678"]);
    const pending = h.getPendingRegistration();
    assert.ok(pending, "pendingRegistration must be populated");
    assert.equal(pending.phoneNumber, "0912345678");
    assert.equal(pending.fullName, "Trần Minh Cường");
    assert.equal(pending.registeredLockerId, "locker-1");
    assert.equal(pending.termsVersion, "1.0", "termsVersion must be 1.0");
    assert.equal(pending.privacyVersion, "1.0", "privacyVersion must be 1.0");

    // ISO 8601 UTC timestamp check
    assert.equal(typeof pending.consentedAt, "string");
    assert.match(
      pending.consentedAt,
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d{1,3})?Z$/,
      "consentedAt must be in UTC ISO 8601 format"
    );
    const parsedTime = new Date(pending.consentedAt).getTime();
    assert.ok(parsedTime >= beforeSubmit - 1000 && parsedTime <= afterSubmit + 1000);
    assert.equal(new Date(pending.consentedAt).toISOString(), pending.consentedAt);

    // Navigated to verify-otp
    const lastRoute = h.routes[h.routes.length - 1];
    assert.equal(lastRoute.route.pathname, "/verify-otp");
    assert.equal(lastRoute.route.params.phone, "0912345678");
    assert.equal(lastRoute.route.params.flow, "register");
  });

  test("authApi.register serializes termsVersion, privacyVersion, and consentedAt", async () => {
    const apiCalls = [];
    const { authApi } = loadModule("features/auth/api.ts", {
      "@/lib/api-client": {
        apiRequest: async (path, opts) => {
          apiCalls.push({ path, opts });
          return { accessToken: "tok", refreshToken: "ref" };
        },
      },
    });

    const payload = {
      phoneNumber: "0912345678",
      password: "pass",
      fullName: "User A",
      registeredLockerId: "l1",
      otpCode: "123456",
      termsVersion: "1.0",
      privacyVersion: "1.0",
      consentedAt: "2026-11-17T10:00:00.000Z",
    };

    await authApi.register(payload);
    assert.equal(apiCalls.length, 1);
    assert.equal(apiCalls[0].path, "/auth/register");
    assert.equal(apiCalls[0].opts.method, "POST");

    const sentBody = JSON.parse(apiCalls[0].opts.body);
    assert.equal(sentBody.termsVersion, "1.0");
    assert.equal(sentBody.privacyVersion, "1.0");
    assert.equal(sentBody.consentedAt, "2026-11-17T10:00:00.000Z");
    assert.equal(sentBody.phoneNumber, "0912345678");
    assert.equal(sentBody.otpCode, "123456");
  });

  test("submit error or retry preserves accepted consent, viewed document state, and enables retry", async () => {
    const h = setupRegisterHarness({ otpError: new Error("Lỗi kết nối OTP từ nhà mạng") });

    // Fill valid info
    h.setFullName("Trần Minh Cường");
    h.setPhone("0912345678");
    h.setPassword("ValidPass123");
    h.setConfirm("ValidPass123");
    h.setLocker({ value: "locker-1", label: "Tủ 1" });

    // Open legal docs and check consent
    h.clickTerms();
    h.clickPrivacy();
    h.acceptConsent(true);

    const getSubmitButton = () => h.findNodes((n) => n.type?.displayName === "Button" && n.props?.size === "lg")[0];
    const getCheckbox = () => h.findNodes("Checkbox")[0];

    // Trigger failed submit
    await h.submit();

    // Verify error displayed and consent state retained
    const errorNode = h.findNodes((n) => n.props?.className?.includes("text-danger"))[0];
    assert.ok(errorNode, "Error paragraph should be displayed");
    assert.equal(errorNode.props.children, "Lỗi kết nối OTP từ nhà mạng");

    // Consent checkbox must still be checked and not disabled
    assert.equal(getCheckbox().props.isSelected, true, "Consent must remain accepted after submit error");
    assert.equal(getCheckbox().props.isDisabled, false, "Consent checkbox must remain usable");
    assert.equal(getSubmitButton().props.isDisabled, false, "Submit button must remain enabled for retry");

    // Retry succeeds when error is cleared
    h.setOtpError(null);
    await h.submit();

    assert.ok(h.getPendingRegistration(), "Pending registration succeeded on retry");
    assert.equal(h.getPendingRegistration().termsVersion, "1.0");
  });
});

// ---------------------------------------------------------------------------
// 2. Return note validator & draft preservation
// ---------------------------------------------------------------------------

function setupReturnHarness() {
  const slots = [];
  let cursor = 0;
  let tree = null;
  const uploads = [];
  const creates = [];
  const routes = [];

  const component = (name) => name;
  const ui = new Proxy(
    {
      Button: { Label: "Button.Label" },
      Card: { Body: "Card.Body" },
      Typography: { Paragraph: "Paragraph" },
    },
    { get: (target, name) => target[name] ?? component(name) }
  );

  const screenModule = loadModule("app/(resident)/returns/new.tsx", {
    react: {
      useState(initial) {
        const i = cursor++;
        slots[i] ??= { value: initial };
        return [
          slots[i].value,
          (val) => {
            slots[i].value = val;
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
      launchCameraAsync: async () => ({
        canceled: false,
        assets: [{ uri: "file://camera-photo.jpg" }],
      }),
    },
    "expo-router": {
      router: {
        replace: (route) => routes.push({ action: "replace", route }),
      },
    },
    "heroui-native": ui,
    "react-native": {
      Linking: {},
      ScrollView: "ScrollView",
      View: "View",
    },
    "@/components/ui/resident-form": { ResidentForm: "ResidentForm" },
    "@/components/ui/parcel-image": { ParcelImage: "ParcelImage" },
    "@/components/ui/themed-safe-area-view": { SafeAreaView: "SafeAreaView" },
    "@/components/ui/action-error": { ActionError: "ActionError" },
    "@/components/icons/gravity-icon": { GravityIcon: "GravityIcon" },
    "@/components/ui/resident-ui": {
      FlowSteps: "FlowSteps",
      ScreenHeader: "ScreenHeader",
    },
    "@/features/returns/api": {
      returnApi: {
        uploadImage(uri) {
          const resp = deferred();
          uploads.push({ uri, resp });
          return resp.promise;
        },
        create(imageUrl, note) {
          const resp = deferred();
          creates.push({ imageUrl, note, resp });
          return resp.promise;
        },
      },
    },
  });

  const render = () => {
    cursor = 0;
    tree = screenModule.default();
    return tree;
  };

  render();

  return {
    render,
    getTree: () => tree,
    findNodes: (type) => collectNodes(tree).filter((n) => n.type === type),
    uploads,
    creates,
    routes,
    async takePhoto() {
      const photoBtn = collectNodes(tree).find((n) => n.type === ui.Button);
      await photoBtn.props.onPress();
      await this.flush();
    },
    setNote(value) {
      const textArea = collectNodes(tree).find((n) => n.type === "TextArea");
      textArea.props.onChangeText(value);
      render();
    },
    submit() {
      const submitBtn = collectNodes(tree)
        .filter((n) => n.type === ui.Button)
        .at(-1);
      return submitBtn.props.onPress();
    },
    async flush() {
      for (let i = 0; i < 6; i++) await Promise.resolve();
      render();
    },
  };
}

describe("Return note validator & draft preservation", () => {
  test("screen rejects empty and whitespace-only notes (including Unicode whitespace) without uploading or creating", async () => {
    const h = setupReturnHarness();
    await h.takePhoto();

    // ASCII whitespace, tabs, newlines, and Unicode spaces (NBSP \u00A0, Em space \u2003, Ideographic space \u3000)
    const whitespaceVariants = [
      "",
      "   ",
      "\t\t",
      "\n\r\n",
      "\u00A0",
      "\u2002",
      "\u2003",
      "\u3000",
      "  \u00A0 \t \n \u3000  ",
    ];

    for (const invalidNote of whitespaceVariants) {
      h.setNote(invalidNote);
      h.submit();
      await h.flush();

      assert.equal(h.uploads.length, 0, `Must not upload on whitespace note: ${JSON.stringify(invalidNote)}`);
      assert.equal(h.creates.length, 0, `Must not create on whitespace note: ${JSON.stringify(invalidNote)}`);

      const textField = h.findNodes("TextField")[0];
      assert.equal(textField.props.isInvalid, true);

      const fieldError = h.findNodes("FieldError").find(
        (n) => n.props?.children && n.props.children.includes("ghi chú")
      );
      assert.ok(fieldError, "FieldError must be rendered for note");
      assert.equal(fieldError.props.children, "Hãy nhập ghi chú về món đồ cần gửi.");
      assert.equal(fieldError.props.textProps.accessibilityRole, "alert");
    }
  });

  test("returnApi.create rejects blank and Unicode-whitespace notes before HTTP dispatch", async () => {
    const httpCalls = [];
    const { returnApi } = loadModule("features/returns/api.ts", {
      "expo-file-system": { File: class {} },
      "@/lib/api-client": {
        apiRequest: async (...args) => {
          httpCalls.push(args);
          return { id: "ret-123" };
        },
      },
    });

    const blankVariants = [
      "",
      " ",
      "\t\n",
      "\u00A0\u00A0",
      " \u3000 ",
    ];

    for (const blank of blankVariants) {
      await assert.rejects(
        () => returnApi.create("https://example.test/img.jpg", blank),
        (err) => {
          assert.equal(err.message, "Hãy nhập ghi chú về món đồ cần gửi.");
          return true;
        }
      );
    }
    assert.equal(httpCalls.length, 0, "No HTTP call should be made when note is blank");
  });

  test("screen trims leading and trailing whitespace from note before API submission", async () => {
    const h = setupReturnHarness();
    await h.takePhoto();

    // Input with leading/trailing spaces and Unicode NBSP
    h.setNote("  \u00A0 Hộp giày gửi trả shop Lazada \t \n ");
    h.submit();

    assert.equal(h.uploads.length, 1);
    h.uploads[0].resp.resolve("https://example.test/uploaded-shoe.jpg");
    await h.flush();

    assert.equal(h.creates.length, 1);
    assert.deepEqual(h.creates[0].args || [h.creates[0].imageUrl, h.creates[0].note], [
      "https://example.test/uploaded-shoe.jpg",
      "Hộp giày gửi trả shop Lazada",
    ]);

    h.creates[0].resp.resolve({ id: "return-999" });
    await h.flush();

    assert.equal(h.routes[0].route.pathname, "/returns/[id]");
    assert.equal(h.routes[0].route.params.id, "return-999");
  });

  test("screen retains photo and draft note when image upload fails, allowing retry", async () => {
    const h = setupReturnHarness();
    await h.takePhoto();
    h.setNote("Sách trả thư viện");

    h.submit();
    assert.equal(h.uploads.length, 1);
    h.uploads[0].resp.reject(new Error("Lỗi tải ảnh lên"));
    await h.flush();

    assert.equal(h.creates.length, 0);

    // Verify draft note and photo are retained
    const textArea = h.findNodes("TextArea")[0];
    assert.equal(textArea.props.value, "Sách trả thư viện");
    const parcelImage = h.findNodes("ParcelImage")[0];
    assert.equal(parcelImage.props.uri, "file://camera-photo.jpg");

    // ActionError with retry callback
    const actionError = h.findNodes("ActionError")[0];
    assert.ok(actionError);
    assert.equal(actionError.props.message, "Lỗi tải ảnh lên");

    // Retrying triggers upload again
    actionError.props.onRetry();
    await h.flush();
    assert.equal(h.uploads.length, 2);

    h.uploads[1].resp.resolve("https://example.test/retry-img.jpg");
    await h.flush();
    assert.equal(h.creates.length, 1);
    assert.equal(h.creates[0].imageUrl, "https://example.test/retry-img.jpg");
  });

  test("screen retains uploaded image URL and draft note when request creation fails, avoiding re-upload on retry", async () => {
    const h = setupReturnHarness();
    await h.takePhoto();
    h.setNote("Đồ dùng văn phòng");

    h.submit();
    assert.equal(h.uploads.length, 1);
    h.uploads[0].resp.resolve("https://example.test/cached-img.jpg");
    await h.flush();

    assert.equal(h.creates.length, 1);
    h.creates[0].resp.reject(new Error("Máy chủ bận, vui lòng thử lại"));
    await h.flush();

    // Draft note and image still present
    const textArea = h.findNodes("TextArea")[0];
    assert.equal(textArea.props.value, "Đồ dùng văn phòng");

    // Retry does NOT upload image again; it reuses cached URL
    const actionError = h.findNodes("ActionError")[0];
    actionError.props.onRetry();
    await h.flush();

    assert.equal(h.uploads.length, 1, "Image must NOT be uploaded again if URI hasn't changed");
    assert.equal(h.creates.length, 2, "Create should be retried directly");
    assert.equal(h.creates[1].imageUrl, "https://example.test/cached-img.jpg");
  });
});

// ---------------------------------------------------------------------------
// 3. ProblemDetails error mapper & field error assignments
// ---------------------------------------------------------------------------

function setupApiErrorHarness(responseBody, responseStatus = 400) {
  const jsonResponse = new Response(
    typeof responseBody === "string" ? responseBody : JSON.stringify(responseBody),
    {
      status: responseStatus,
      headers: { "Content-Type": "application/json" },
    }
  );

  const storageMock = {
    readSessionSnapshot: async () => ({ revision: 1, session: null }),
    isSessionCurrent: () => true,
    saveRefreshedSession: async () => true,
    clearSessionIfCurrent: async () => 1,
  };

  const apiClient = loadModule("lib/api-client.ts", {
    "@/config/env": { ENV: { API_URL: "https://api.test", API_TIMEOUT: 5000 } },
    "@/features/auth/storage": storageMock,
    "@/lib/text-encoding-diagnostics": { diagnoseApiText: () => {} },
    __fetch: async () => jsonResponse,
  });

  return { apiClient, parse: () => apiClient.apiRequest("/test-endpoint") };
}

describe("ProblemDetails error mapper & field assignments", () => {
  test("ProblemDetails maps authentication error codes to Vietnamese messages", async () => {
    const authCodeMap = {
      "auth/invalid_credentials": "Số điện thoại hoặc mật khẩu không đúng.",
      "auth/invalid_token": "Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.",
      "auth/authentication_required": "Vui lòng đăng nhập để tiếp tục.",
      "auth/token_expired": "Phiên đăng nhập đã hết hạn.",
      "auth/invalid_refresh_token": "Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.",
      "auth/invalid_otp": "Mã OTP không đúng hoặc đã hết hạn.",
      "auth/user_already_exists": "Tài khoản đã tồn tại.",
      "auth/password_change_required": "Vui lòng đổi mật khẩu để tiếp tục.",
      "auth/invalid_password": "Mật khẩu hiện tại không đúng hoặc mật khẩu mới không hợp lệ.",
    };

    for (const [code, expectedMessage] of Object.entries(authCodeMap)) {
      const h = setupApiErrorHarness({ code, detail: "Ignored backend detail" }, 400);
      await assert.rejects(h.parse(), (err) => {
        assert.equal(err.code, code);
        assert.equal(err.message, expectedMessage);
        assert.equal(err.status, 400);
        return true;
      });
    }
  });

  test("ProblemDetails maps locker, parcel, delivery, and return domain error codes to Vietnamese messages", async () => {
    const domainMap = {
      "locker/not_found": "Không tìm thấy tủ.",
      "locker/not_operational": "Tủ hiện không hoạt động. Vui lòng liên hệ hỗ trợ.",
      "locker/no_available_compartment": "Tủ không còn ngăn trống phù hợp.",
      "locker/offline": "Tủ đang mất kết nối. Vui lòng thử lại sau.",
      "locker/open_failed": "Chưa mở được ngăn tủ. Vui lòng thử lại hoặc báo sự cố.",
      "parcel/not_found": "Không tìm thấy bưu kiện.",
      "parcel/payment_required": "Vui lòng thanh toán phí quá hạn trước khi nhận hàng.",
      "parcel/remote_unlock_disabled": "Tủ không cho phép mở từ xa.",
      "parcel/storage_expired": "Bưu kiện đã quá thời hạn lưu trữ.",
      "parcel/invalid_state": "Trạng thái bưu kiện không cho phép thao tác này.",
      "delivery/not_found": "Không tìm thấy yêu cầu giao hàng.",
      "delivery/invalid_state": "Yêu cầu giao hàng đã thay đổi trạng thái. Vui lòng tải lại.",
      "delivery/approval_expired": "Yêu cầu xác nhận hàng đã hết hạn.",
      "delivery/recipient_cannot_receive":
        "Bạn chưa thể nhận thêm kiện. Hãy kiểm tra gói đang hiệu lực và số kiện đang lưu; liên hệ ban quản lý nếu quyền lợi gói cần đối chiếu.",
      "return/not_found": "Không tìm thấy yêu cầu gửi hàng.",
      "return/invalid_state": "Trạng thái yêu cầu gửi hàng không cho phép thao tác này.",
      "return/invalid_pickup_code": "Mã lấy hàng không đúng hoặc đã hết hạn.",
    };

    for (const [code, expectedMessage] of Object.entries(domainMap)) {
      const h = setupApiErrorHarness({ code }, 409);
      await assert.rejects(h.parse(), (err) => {
        assert.equal(err.code, code);
        assert.equal(err.message, expectedMessage);
        assert.equal(err.status, 409);
        return true;
      });
    }
  });

  test("ProblemDetails maps payment, subscription, image, and common system error codes to Vietnamese messages", async () => {
    const systemMap = {
      "common/access_denied": "Bạn không có quyền thực hiện thao tác này.",
      "common/invalid_request": "Yêu cầu không hợp lệ.",
      "common/internal_error": "Máy chủ đang gặp sự cố. Vui lòng thử lại sau.",
      "common/rate_limited": "Bạn thao tác quá nhanh. Vui lòng chờ rồi thử lại.",
      "common/request_timed_out": "Yêu cầu quá thời gian. Vui lòng thử lại.",
      "subscription/invalid_payment": "Thanh toán gói chưa hợp lệ.",
      "payment/unavailable": "Dịch vụ thanh toán đang tạm ngừng. Vui lòng thử lại sau.",
      "payment/invalid_request": "Yêu cầu thanh toán không hợp lệ.",
      "payment/not_found": "Không tìm thấy giao dịch thanh toán.",
      "image/too_large": "Ảnh quá lớn. Vui lòng chọn ảnh có dung lượng nhỏ hơn.",
      "image/invalid_format": "Định dạng ảnh không được hỗ trợ.",
      "validation/invalid_input": "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.",
    };

    for (const [code, expectedMessage] of Object.entries(systemMap)) {
      const h = setupApiErrorHarness({ code }, 400);
      await assert.rejects(h.parse(), (err) => {
        assert.equal(err.code, code);
        assert.equal(err.message, expectedMessage);
        return true;
      });
    }
  });

  test("ProblemDetails assigns structured field-specific validation errors and ignores malformed field values", async () => {
    const problemPayload = {
      type: "https://tools.ietf.org/html/rfc7231#section-6.5.1",
      title: "One or more validation errors occurred.",
      status: 400,
      code: "validation/invalid_input",
      errors: {
        phoneNumber: ["Số điện thoại phải gồm 10 chữ số.", "Số điện thoại không được chứa ký tự đặc biệt."],
        note: ["Ghi chú tối đa 200 ký tự."],
        termsVersion: ["Phiên bản điều khoản không được hỗ trợ."],
        // Malformed fields that must be ignored
        invalidNumberField: 12345,
        invalidObjectField: { message: "invalid" },
        mixedArrayField: ["valid", 123],
      },
    };

    const h = setupApiErrorHarness(problemPayload, 400);
    await assert.rejects(h.parse(), (err) => {
      assert.equal(err.code, "validation/invalid_input");
      assert.equal(err.message, "Thông tin chưa hợp lệ. Vui lòng kiểm tra các trường đã nhập.");
      assert.ok(err.errors, "err.errors must exist");
      assert.deepEqual(err.errors.phoneNumber, [
        "Số điện thoại phải gồm 10 chữ số.",
        "Số điện thoại không được chứa ký tự đặc biệt.",
      ]);
      assert.deepEqual(err.errors.note, ["Ghi chú tối đa 200 ký tự."]);
      assert.deepEqual(err.errors.termsVersion, ["Phiên bản điều khoản không được hỗ trợ."]);
      assert.equal(err.errors.invalidNumberField, undefined);
      assert.equal(err.errors.invalidObjectField, undefined);
      assert.equal(err.errors.mixedArrayField, undefined);
      return true;
    });
  });

  test("ProblemDetails falls back from unknown code to detail, then message, then standard fallback", async () => {
    // 1. Unknown code with detail
    const h1 = setupApiErrorHarness({ code: "custom/unknown_code", detail: "Chi tiết lỗi tuỳ chỉnh" }, 422);
    await assert.rejects(h1.parse(), (err) => {
      assert.equal(err.code, "custom/unknown_code");
      assert.equal(err.message, "Chi tiết lỗi tuỳ chỉnh");
      assert.equal(err.status, 422);
      return true;
    });

    // 2. Unknown code with message (when detail is absent or empty)
    const h2 = setupApiErrorHarness({ code: "custom/unknown_code", detail: "   ", message: "Thông báo từ backend" }, 422);
    await assert.rejects(h2.parse(), (err) => {
      assert.equal(err.message, "Thông báo từ backend");
      return true;
    });

    // 3. Unknown code with neither detail nor message
    const h3 = setupApiErrorHarness({ code: "custom/unknown_code" }, 422);
    await assert.rejects(h3.parse(), (err) => {
      assert.equal(err.message, "Yêu cầu không thể thực hiện.");
      return true;
    });

    // 4. Empty payload object
    const h4 = setupApiErrorHarness({}, 500);
    await assert.rejects(h4.parse(), (err) => {
      assert.equal(err.message, "Yêu cầu không thể thực hiện.");
      assert.equal(err.status, 500);
      assert.equal(err.errors, undefined);
      return true;
    });
  });

  test("ProblemDetails handles malformed JSON and HTTP server errors gracefully", async () => {
    // HTML 502 Bad Gateway response
    const h = setupApiErrorHarness("<html><body>502 Bad Gateway</body></html>", 502);
    await assert.rejects(h.parse(), (err) => {
      assert.equal(err.status, 502);
      assert.equal(err.message, "Yêu cầu không thể thực hiện.");
      assert.equal(err.code, undefined);
      assert.equal(err.errors, undefined);
      return true;
    });
  });

  test("ApiError evaluates retryable flag across network (0), rate-limited (429), 5xx, and client 4xx statuses", () => {
    const { ApiError } = loadModule("lib/api-client.ts", {
      "@/config/env": { ENV: { API_URL: "", API_TIMEOUT: 1000 } },
      "@/features/auth/storage": {},
      "@/lib/text-encoding-diagnostics": { diagnoseApiText: () => {} },
    });

    // Retryable: 0 (network/timeout), 429 (rate limited), 500, 502, 503, 504
    for (const status of [0, 429, 500, 502, 503, 504]) {
      const err = new ApiError("Error", status);
      assert.equal(err.retryable, true, `Status ${status} must be retryable`);
    }

    // Non-retryable: 400, 401, 403, 404, 409, 422
    for (const status of [400, 401, 403, 404, 409, 422]) {
      const err = new ApiError("Error", status);
      assert.equal(err.retryable, false, `Status ${status} must NOT be retryable`);
    }
  });
});
