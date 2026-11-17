const assert = require("node:assert/strict");
const { test } = require("node:test");
const fs = require("node:fs");
const path = require("node:path");

const root = path.resolve(__dirname, "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

test("legal documents contain the approved v1.0 Vietnamese content", () => {
  const content = read("src/features/legal/content.ts");
  assert.match(content, /LEGAL_VERSION = "1\.0"/);
  assert.match(content, /Điều khoản sử dụng Smart Locking v\$\{LEGAL_VERSION\}/);
  assert.match(content, /Chính sách bảo mật Smart Locking v\$\{LEGAL_VERSION\}/);
  assert.match(content, /Không gửi hàng cấm, nguy hiểm, dễ cháy nổ/);
  assert.match(content, /API key không nằm trên thiết bị và không ghi vào log/);
  assert.match(content, /Người dùng có thể yêu cầu xem, sửa, hạn chế hoặc xóa dữ liệu/);
});

test("registration exposes both legal routes and gates consent until both are opened", () => {
  const screen = read("src/features/auth/screens.tsx");
  assert.match(screen, /router\.push\("\/legal\/terms"\)/);
  assert.match(screen, /router\.push\("\/legal\/privacy"\)/);
  assert.match(screen, /isDisabled=\{!viewedTerms \|\| !viewedPrivacy \|\| submitting\}/);
});

test("registration sends versioned UTC consent fields with the API request", () => {
  const api = read("src/features/auth/api.ts");
  const screen = read("src/features/auth/screens.tsx");
  assert.match(api, /termsVersion: payload\.termsVersion/);
  assert.match(api, /privacyVersion: payload\.privacyVersion/);
  assert.match(api, /consentedAt: payload\.consentedAt/);
  assert.match(screen, /termsVersion: LEGAL_VERSION/);
  assert.match(screen, /privacyVersion: LEGAL_VERSION/);
  assert.match(screen, /consentedAt: new Date\(\)\.toISOString\(\)/);
});

test("account settings exposes both legal routes", () => {
  const settings = read("src/app/(resident)/settings.tsx");
  assert.match(settings, /router\.push\("\/legal\/terms"\)/);
  assert.match(settings, /router\.push\("\/legal\/privacy"\)/);
});
