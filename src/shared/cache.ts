import { CACHE_PREFIX, CACHE_TTL_MS } from './constants';
import type { CacheEntry, ElementContext, ExplanationResponse } from './types';

function djb2Hash(str: string): string {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i);
  }
  return (hash >>> 0).toString(36);
}

function cacheKey(context: ElementContext): string {
  return `${CACHE_PREFIX}${djb2Hash(JSON.stringify(context))}`;
}

export async function getCached(
  context: ElementContext,
): Promise<ExplanationResponse | null> {
  const key = cacheKey(context);
  const result = await chrome.storage.local.get(key);
  const entry = result[key] as CacheEntry | undefined;
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    await chrome.storage.local.remove(key);
    return null;
  }
  return entry.explanation;
}

export async function setCached(
  context: ElementContext,
  explanation: ExplanationResponse,
): Promise<void> {
  const key = cacheKey(context);
  const entry: CacheEntry = { explanation, timestamp: Date.now() };
  await chrome.storage.local.set({ [key]: entry });
}

export async function clearExpired(): Promise<void> {
  const all = await chrome.storage.local.get(null);
  const now = Date.now();
  const keysToRemove: string[] = [];
  for (const [key, value] of Object.entries(all)) {
    if (!key.startsWith(CACHE_PREFIX)) continue;
    const entry = value as CacheEntry;
    if (now - entry.timestamp > CACHE_TTL_MS) {
      keysToRemove.push(key);
    }
  }
  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }
}
