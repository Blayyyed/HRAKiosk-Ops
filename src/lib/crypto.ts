// src/lib/crypto.ts

const MASK_CHAR = "*";

export function maskBadge(badge: string): string {
  const trimmed = badge.trim();
  if (!trimmed) {
    return "";
  }
  const keep = trimmed.slice(-4);
  return keep.padStart(trimmed.length, MASK_CHAR);
}

export async function hashBadge(badge: string): Promise<string> {
  const trimmed = badge.trim();
  if (!trimmed) {
    throw new Error("Cannot hash an empty badge value");
  }
  const encoder = new TextEncoder();
  const data = encoder.encode(trimmed);
  const cryptoObj = globalThis.crypto;
  if (!cryptoObj?.subtle) {
    throw new Error("Web Crypto API is not available");
  }
  const digest = await cryptoObj.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
