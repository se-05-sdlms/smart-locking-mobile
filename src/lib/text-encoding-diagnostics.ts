import { ENV } from "@/config/env";

const inspected = new Set<string>();
const fields = ["title", "message", "name", "description", "reason"] as const;

/** Opt-in, development-only evidence at the JSON decode boundary. Never repairs text. */
export function diagnoseApiText(path: string, payload: unknown, contentType: string | null): void {
  if (!__DEV__ || !ENV.DEBUG_TEXT_ENCODING || inspected.size >= 20) return;
  const endpoint = path.split("?")[0];
  if (
    endpoint !== "/subscription-plans" &&
    !/^\/notifications(?:\/[^/]+)?$/.test(endpoint) &&
    !/^\/parcels\/[^/]+\/history$/.test(endpoint)
  )
    return;
  const object =
    payload && typeof payload === "object" ? (payload as Record<string, unknown>) : null;
  const items = object?.items;
  const records: unknown[] = Array.isArray(payload)
    ? payload
    : Array.isArray(items)
      ? items
      : object
        ? [object]
        : [];
  for (const candidate of records) {
    if (!candidate || typeof candidate !== "object") continue;
    const record = candidate as Record<string, unknown>;
    for (const field of fields) {
      const text = record[field];
      if (typeof text !== "string" || !text || inspected.size >= 20) continue;
      const recordId = typeof record.id === "string" ? record.id : "not-provided";
      const key = JSON.stringify([endpoint, recordId, field, text]);
      if (inspected.has(key)) continue;
      inspected.add(key);
      console.info("[Boxora text encoding]", {
        stage: "api-json-decoded",
        endpoint,
        recordId,
        field,
        contentType,
        sample: [...text].slice(0, 240).join(""),
        codePoints: [...text]
          .slice(0, 64)
          .map((character) => `U+${character.codePointAt(0)?.toString(16).toUpperCase()}`),
        containsReplacementCharacter: text.includes("\uFFFD"),
        questionMarkInsideWord: /[\p{L}\p{N}]\?[\p{L}\p{N}]/u.test(text),
      });
    }
  }
}
