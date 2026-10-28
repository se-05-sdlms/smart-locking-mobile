# Resident Bluetooth unlock (#30)

This native client supports resident parcel pickup (P) and return deposit (R), using a fresh authenticated `/bluetooth/workflow/prepare` command. The phone still needs Internet for ownership, payment, policy, cancellation and availability checks. It does not cache r1 permits, generate commands locally or relay unsigned HTTP journal/reset evidence.

The transport uses react-native-ble-plx and the existing firmware GATT service FFF0, command FFF1, response FFF2 and device identity FFF3. It scans for `BOXORA-{deviceIdentifier}`, verifies the readable identity, then sends one ASCII `{decimalRequestId}|EXEC:{c1Command}` frame. Firmware requires a nonzero decimal outer request ID of at most ten digits. The complete frame must fit the negotiated MTU minus three bytes and the firmware's 400-byte limit; oversized frames fail before any write. Android requests MTU 247. No unsupported fragmentation is attempted.

Firmware truncates notifications to 20 bytes, so the client reads the full response characteristic and matches its outer request ID before accepting WORKFLOW_OK or ALREADY_ACCEPTED for the expected subject. It never displays the PIN returned by firmware. These responses acknowledge a command; they do not prove a door opened, a parcel was collected or a return was deposited. Existing backend-confirmed status remains required for physical completion.

Scanning, connection and response waits are bounded. Backgrounding/unmount aborts the session and tears down the connection. The app reports missing native BLE, unsupported platforms, denied permissions, Bluetooth off, identity mismatch, expiry and unconfirmed outcomes explicitly. Expo Go cannot supply this native module. The Expo plugin declares Bluetooth permissions; a native build containing the new module is required.

## Acceptance limits

The existing firmware c1/r1/o1 protocol has no signature or MAC. Fresh server authorization in this client cannot stop an attacker writing a forged command directly to unsigned firmware, nor prove revocation on a disconnected locker. Keep the backend Bluetooth policy disabled until deployment owners accept the protocol/trust limitations; cancellation retrieval remains pending while revocation/physical evidence is unproven. Firmware #150/#160 are outside this change.

Typecheck, changed-file lint/format and Expo configuration validation are software checks only. No Android project was generated, no environment upgrade performed, no APK built/installed, and no real locker transaction attempted. Native compatibility with the current Expo/React Native stack, iOS/Android permission behavior, MTU negotiation, identity reads, disconnect/retry and physical door/journal synchronization still require acceptance on actual devices. This PR remains draft and does not claim device readiness.
