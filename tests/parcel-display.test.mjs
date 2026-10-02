import assert from "node:assert/strict";
import { test } from "node:test";
import { dueLabel, unlockLabel } from "../src/features/parcels/display.ts";

test("pickup countdown distinguishes remaining, expired and invalid deadlines", () => {
  const now = Date.parse("2026-10-02T03:00:00Z");
  assert.equal(dueLabel("2026-10-05T03:00:00Z", now), "Còn 3 ngày");
  assert.equal(dueLabel("2026-10-02T04:00:00Z", now), "Còn 1 giờ");
  assert.equal(dueLabel("2026-10-02T03:00:00Z", now), "Đã quá hạn");
  assert.equal(dueLabel("invalid", now), "Chưa có hạn nhận");
});

test("server command acceptance never claims the physical door is open", () => {
  assert.equal(unlockLabel("sent", false), "Đã gửi lệnh mở");
  assert.equal(unlockLabel("sent", true), "Đã mở (demo)");
  assert.equal(unlockLabel("failed", false), "Mở thất bại");
});
