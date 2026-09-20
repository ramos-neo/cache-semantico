import { createHash } from "node:crypto";
import { runtimeConfig } from "./config.js";

export type Fingerprint = {
  prompt_version: string;
  rules_version: string;
  model_capability: string;
  normalized_text: string;
};

export function normalizeText(text: string): string {
  return text.replace(/\s+/g, " ").trim().toLowerCase();
}

export function buildFingerprint(message: string): Fingerprint {
  return {
    prompt_version: runtimeConfig.prompt_version,
    rules_version: runtimeConfig.rules_version,
    model_capability: runtimeConfig.model_capability,
    normalized_text: normalizeText(message),
  };
}

export function buildCacheKey(fingerprint: Fingerprint): string {
  const raw = JSON.stringify(fingerprint, Object.keys(fingerprint).sort());
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
