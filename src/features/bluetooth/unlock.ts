import { fromByteArray, toByteArray } from "base64-js";
import type { BleManager, Device } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";
import { apiRequest } from "@/lib/api-client";

const SERVICE = "0000fff0-0000-1000-8000-00805f9b34fb";
const COMMAND = "0000fff1-0000-1000-8000-00805f9b34fb";
const RESPONSE = "0000fff2-0000-1000-8000-00805f9b34fb";
const IDENTITY = "0000fff3-0000-1000-8000-00805f9b34fb";
type Kind = "P" | "R";
type Command = { deviceIdentifier: string; channel: number; command: string; expiresAt: string };
let active = false;

function check(signal: AbortSignal): void {
  if (signal.aborted)
    throw new Error("Đã dừng kết nối Bluetooth. Hãy kiểm tra trạng thái trước khi thử lại.");
}

function decode(value: string | null): string {
  if (!value) return "";
  return String.fromCharCode(...toByteArray(value));
}

function stopScan(manager: BleManager): void {
  void manager.stopDeviceScan().catch(() => undefined);
}

async function bounded<T>(operation: Promise<T>, signal: AbortSignal): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  let abort: (() => void) | undefined;
  try {
    // Native work starts before this helper receives its promise. If the screen
    // has already aborted, still consume any eventual rejection during teardown.
    if (signal.aborted) void operation.catch(() => undefined);
    check(signal);
    return await Promise.race([
      operation,
      new Promise<never>((_, reject) => {
        timer = setTimeout(
          () =>
            reject(
              new Error(
                "Kết nối Bluetooth quá thời gian. Chưa xác nhận được kết quả; hãy kiểm tra cửa và trạng thái giao dịch."
              )
            ),
          10_000
        );
        abort = () => reject(new Error("Đã dừng kết nối Bluetooth."));
        signal.addEventListener("abort", abort, { once: true });
        if (signal.aborted) abort();
      }),
    ]);
  } finally {
    clearTimeout(timer);
    if (abort) signal.removeEventListener("abort", abort);
  }
}

async function permissions(): Promise<void> {
  if (Platform.OS !== "android") return;
  const requested =
    Number(Platform.Version) >= 31
      ? [
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
          PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        ]
      : [PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(requested);
  if (requested.some((permission) => result[permission] !== PermissionsAndroid.RESULTS.GRANTED)) {
    throw new Error(
      "Cần quyền Bluetooth / thiết bị ở gần (vị trí trên Android cũ). Hãy cấp quyền trong Cài đặt để tìm tủ."
    );
  }
}

async function ready(manager: BleManager, signal: AbortSignal): Promise<void> {
  const until = Date.now() + 8_000;
  while (Date.now() < until) {
    check(signal);
    const state = await bounded(manager.state(), signal);
    if (state === "PoweredOn") return;
    if (state === "Unauthorized")
      throw new Error("Bluetooth chưa được cấp quyền. Hãy mở Cài đặt của ứng dụng.");
    if (state === "Unsupported") throw new Error("Thiết bị này không hỗ trợ Bluetooth Low Energy.");
    if (state === "PoweredOff") throw new Error("Hãy bật Bluetooth rồi thử lại khi đứng gần tủ.");
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error("Bluetooth chưa sẵn sàng. Hãy kiểm tra quyền và thử lại.");
}

function find(manager: BleManager, identity: string, signal: AbortSignal): Promise<Device> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (device?: Device, error?: Error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal.removeEventListener("abort", abort);
      stopScan(manager);
      if (device) resolve(device);
      else reject(error);
    };
    const abort = () => finish(undefined, new Error("Đã dừng tìm tủ Bluetooth."));
    const timer = setTimeout(
      () =>
        finish(
          undefined,
          new Error(
            "Không tìm thấy đúng tủ ở gần. Hãy đến gần tủ, kiểm tra nguồn / Bluetooth hoặc liên hệ người vận hành."
          )
        ),
      12_000
    );
    signal.addEventListener("abort", abort, { once: true });
    if (signal.aborted) {
      abort();
      return;
    }
    void manager
      .startDeviceScan([SERVICE], { allowDuplicates: false }, (error, device) => {
        if (error) {
          finish(
            undefined,
            new Error(
              "Không quét được Bluetooth. Hãy kiểm tra quyền và dịch vụ vị trí nếu điện thoại yêu cầu."
            )
          );
          return;
        }
        if (
          device &&
          (device.localName === `BOXORA-${identity}` || device.name === `BOXORA-${identity}`)
        )
          finish(device);
      })
      .catch(() => finish(undefined, new Error("Không khởi động được quét Bluetooth.")));
  });
}

/** Relays a fresh server command. A BLE response never completes a parcel/return in the app. */
export async function unlockViaBluetooth(
  kind: Kind,
  subjectId: string,
  signal: AbortSignal
): Promise<void> {
  if (active) throw new Error("Một kết nối Bluetooth đang xử lý. Hãy chờ kết quả.");
  if (Platform.OS !== "android" && Platform.OS !== "ios")
    throw new Error("Bluetooth cần ứng dụng native trên điện thoại.");
  active = true;
  let manager: BleManager | undefined;
  let device: Device | undefined;
  const abort = () => {
    if (manager) stopScan(manager);
    if (device) void device.cancelConnection().catch(() => undefined);
  };
  try {
    check(signal);
    await permissions();
    check(signal);
    try {
      const native = await import("react-native-ble-plx");
      manager = new native.BleManager();
    } catch {
      throw new Error(
        "Bản ứng dụng này chưa có Bluetooth native. Cần bản cài đặt có BLE; Expo Go không hỗ trợ."
      );
    }
    signal.addEventListener("abort", abort, { once: true });
    await ready(manager, signal);
    // Server enforces ownership, payment, policy, cancellation, and locker availability.
    // No cached r1 permit: a disconnected phone cannot verify current authorization.
    const command = await apiRequest<Command>("/bluetooth/workflow/prepare", {
      method: "POST",
      authenticated: true,
      body: JSON.stringify({ kind, subjectId }),
      signal,
    });
    check(signal);
    const fields = command.command.split("|");
    const expires = Number(fields[7]) * 1000;
    if (
      fields.length !== 9 ||
      fields[0] !== "c1" ||
      !command.deviceIdentifier ||
      command.deviceIdentifier === "*" ||
      fields[1] !== command.deviceIdentifier ||
      fields[3] !== String(command.channel) ||
      fields[4] !== kind ||
      fields[2] !== subjectId.replaceAll("-", "").toLowerCase() ||
      !/^[a-f0-9]{32}$/.test(fields[2]) ||
      !/^[a-f0-9]{32}$/.test(fields[8]) ||
      !/^[\x20-\x7e]+$/.test(command.command) ||
      command.command.length > 400 ||
      command.channel < 1 ||
      command.channel > 4 ||
      !Number.isFinite(expires) ||
      expires <= Date.now() ||
      !Number.isFinite(Date.parse(command.expiresAt)) ||
      Date.parse(command.expiresAt) <= Date.now()
    ) {
      throw new Error("Lệnh Bluetooth không hợp lệ hoặc đã hết hạn. Hãy tải lại trạng thái.");
    }
    // Firmware parseFrame requires a nonzero decimal request ID (at most 10 digits).
    // This correlates transport responses; it is not an authentication credential.
    const requestId = String((Date.now() % 9_000_000_000) + 1_000_000_000);
    const frame = `${requestId}|EXEC:${command.command}`;
    if (frame.length > 400)
      throw new Error("Lệnh vượt giới hạn Bluetooth của tủ. Chưa gửi lệnh mở.");
    device = await find(manager, command.deviceIdentifier, signal);
    check(signal);
    device = await bounded(device.connect({ timeout: 10_000 }), signal);
    check(signal);
    if (Platform.OS === "android") device = await bounded(device.requestMTU(247), signal);
    if (device.mtu < frame.length + 3) {
      throw new Error(
        "Kết nối Bluetooth chưa hỗ trợ độ dài lệnh của tủ. Chưa gửi lệnh; hãy thử lại hoặc liên hệ người vận hành."
      );
    }
    device = await bounded(device.discoverAllServicesAndCharacteristics(), signal);
    check(signal);
    const identity = decode(
      (await bounded(device.readCharacteristicForService(SERVICE, IDENTITY), signal)).value
    );
    if (identity !== command.deviceIdentifier)
      throw new Error("Thiết bị Bluetooth không khớp tủ của giao dịch. Chưa gửi lệnh mở.");
    check(signal);
    if (Date.now() >= expires)
      throw new Error("Lệnh đã hết hạn trong lúc tìm tủ. Hãy kiểm tra trạng thái và thử lại.");
    await bounded(
      device.writeCharacteristicWithResponseForService(
        SERVICE,
        COMMAND,
        fromByteArray(Uint8Array.from(frame, (c) => c.charCodeAt(0)))
      ),
      signal
    );
    // Firmware NOTIFY is truncated to 20 bytes. Read the complete characteristic;
    // correlate the outer request ID, and never upload unsigned HTTP events.
    const until = Date.now() + 10_000;
    while (Date.now() < until) {
      check(signal);
      const response = decode(
        (await bounded(device.readCharacteristicForService(SERVICE, RESPONSE), signal)).value
      );
      if (response.startsWith(`${requestId}|`)) {
        const result = response.slice(requestId.length + 1);
        if (new RegExp(`^WORKFLOW_OK:${command.channel}:${fields[2]}:\\d{6}$`, "i").test(result))
          return;
        if (
          result === `ALREADY_ACCEPTED:${fields[2]}` ||
          new RegExp(`^ALREADY_ACCEPTED:${fields[2]}:\\d{6}$`, "i").test(result)
        )
          return;
        throw new Error(
          "Tủ chưa chấp nhận lệnh mở. Hãy kiểm tra cửa, trạng thái giao dịch hoặc liên hệ người vận hành."
        );
      }
      await new Promise((resolve) => setTimeout(resolve, 350));
    }
    throw new Error(
      "Đã gửi lệnh nhưng chưa xác nhận được phản hồi. Kiểm tra cửa và tải lại trạng thái trước khi thử lại."
    );
  } finally {
    signal.removeEventListener("abort", abort);
    if (manager) stopScan(manager);
    // Teardown must not keep the UI busy indefinitely after a timeout/disconnect.
    try {
      if (device) void device.cancelConnection().catch(() => undefined);
      if (manager)
        await bounded(manager.destroy(), new AbortController().signal).catch(() => undefined);
    } finally {
      active = false;
    }
  }
}
