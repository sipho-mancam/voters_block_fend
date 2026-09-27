import { useEffect, useState } from "react";

const DEVICE_ID_KEY = "voters_block_device_id";
let inMemoryId: string | null = null;
let pendingId: Promise<string> | null = null;

function canvasFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    if (!ctx) return "canvas-unsupported";
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(125, 1, 62, 20);
    ctx.fillStyle = "#069";
    ctx.fillText("fingerprint_test_123", 2, 15);
    ctx.fillStyle = "rgba(102, 204, 0, 0.7)";
    ctx.fillText("fingerprint_test_123", 4, 17);
    return canvas.toDataURL();
  } catch {
    return "canvas-unsupported";
  }
}

function webglFingerprint(): string {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return "webgl-unsupported";
    const debugInfo = gl.getExtension("WEBGL_debug_renderer_info");
    return String(debugInfo
      ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
      : gl.getParameter(gl.VERSION));
  } catch {
    return "webgl-unsupported";
  }
}

function randomId(): string {
  const bytes = new Uint8Array(16);
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(bytes);
  } else {
    for (let i = 0; i < bytes.length; i++) bytes[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function generateDeviceId(): Promise<string> {
  let screenRes = "unknown";
  let timeZone = "unknown";
  let language = "unknown";
  try {
    screenRes = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
  } catch { /* Screen details can be unavailable in restricted browsers. */ }
  try {
    timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || "unknown";
  } catch { /* Time zone can be unavailable. */ }
  try {
    language = navigator.language || "unknown";
  } catch { /* Language can be unavailable. */ }

  const canvas = canvasFingerprint();
  const webgl = webglFingerprint();
  // Shared, low-entropy browser defaults should not give different voters the same ID.
  if (canvas === "canvas-unsupported" && webgl === "webgl-unsupported") {
    return randomId();
  }

  const fingerprint = [
    screenRes, timeZone, language, canvas, webgl,
  ].join("||");

  try {
    const hash = await globalThis.crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(fingerprint),
    );
    return Array.from(new Uint8Array(hash), (byte) => byte.toString(16).padStart(2, "0"))
      .join("")
      .slice(0, 32);
  } catch {
    // Some private contexts do not expose SubtleCrypto.
    return randomId();
  }
}

function readStoredId(): string | null {
  try {
    return window.localStorage.getItem(DEVICE_ID_KEY);
  } catch {
    return null;
  }
}

function saveId(id: string): void {
  try {
    window.localStorage.setItem(DEVICE_ID_KEY, id);
  } catch {
    // Keep the ID in memory if storage is blocked; persistence cannot be guaranteed.
  }
}

function resolveDeviceId(): Promise<string> {
  const storedId = readStoredId();
  if (storedId) {
    inMemoryId = storedId;
    saveId(storedId);
    return Promise.resolve(storedId);
  }
  if (inMemoryId) {
    saveId(inMemoryId);
    return Promise.resolve(inMemoryId);
  }
  if (!pendingId) {
    pendingId = generateDeviceId().then((id) => {
      inMemoryId = id;
      saveId(id);
      return id;
    }).finally(() => { pendingId = null; });
  }
  return pendingId;
}

export function useDeviceId() {
  const [deviceId, setDeviceId] = useState("");

  useEffect(() => {
    let mounted = true;
    void resolveDeviceId().then((id) => {
      if (mounted) setDeviceId(id);
    });
    return () => { mounted = false; };
  }, []);

  return deviceId;
}