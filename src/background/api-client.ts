import type { ElementContext, ExplanationResponse } from '../shared/types';
import { FETCH_TIMEOUT_MS } from '../shared/constants';

const API_KEY = import.meta.env.VITE_NVIDIA_API_KEY as string;
const MODEL = import.meta.env.VITE_NVIDIA_MODEL as string || 'meta/llama-3.3-70b-instruct';

export class NetworkError extends Error {
  constructor(message = 'Network request failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class RateLimitError extends Error {
  constructor() {
    super('Rate limited');
    this.name = 'RateLimitError';
  }
}

export class ServerError extends Error {
  constructor() {
    super('Server error');
    this.name = 'ServerError';
  }
}

export class ParseError extends Error {
  constructor() {
    super('Invalid response');
    this.name = 'ParseError';
  }
}

export class NoApiKeyError extends Error {
  constructor() {
    super('No API key configured');
    this.name = 'NoApiKeyError';
  }
}

function buildPrompt(context: ElementContext): string {
  const parts = [`<${context.tagName}>`];
  if (context.textContent) parts.push(`text:"${context.textContent}"`);
  if (context.ariaLabel) parts.push(`aria:"${context.ariaLabel}"`);
  if (context.role) parts.push(`role:${context.role}`);
  if (context.id) parts.push(`id:${context.id}`);
  if (context.title) parts.push(`title:"${context.title}"`);
  if (context.placeholder) parts.push(`placeholder:"${context.placeholder}"`);
  if (context.href) parts.push(`href:${context.href}`);
  if (context.inputType) parts.push(`type:${context.inputType}`);
  if (context.className) parts.push(`class:"${context.className}"`);
  if (context.parentTag) parts.push(`parent:<${context.parentTag}>`);
  if (context.nearbyText) parts.push(`nearby:"${context.nearbyText}"`);
  parts.push(`page:"${context.pageTitle}" (${context.pagePathname})`);

  return `You are a UI expert. A user right-clicked this element on a webpage and wants to understand exactly what it does.

Element: ${parts.join(' | ')}

Explain this element clearly for a non-technical user. Be specific to THIS page and context — not generic.

Reply ONLY with JSON (no markdown):
{
  "elementIdentity": "short descriptive name (e.g. 'Add to Cart Button', 'Email Input Field')",
  "primaryPurpose": "one clear sentence about what this element is for on this specific page",
  "whatHappens": "describe exactly what happens when the user clicks/interacts with this element (e.g. 'Opens a dropdown menu with sorting options' or 'Submits the login form and redirects to dashboard')",
  "example": "a concrete real-world scenario, e.g. 'If you type your email here and click Submit, you will receive a password reset link in your inbox within 2 minutes'",
  "useCases": ["specific use case 1", "specific use case 2", "specific use case 3"],
  "relatedElements": ["nearby related element"] or null
}`;
}

export async function requestExplanation(
  context: ElementContext,
): Promise<ExplanationResponse> {
  if (!API_KEY) throw new NoApiKeyError();

  const prompt = buildPrompt(context);
  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.3,
        max_tokens: 768,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NetworkError('Request timed out');
    }
    throw new NetworkError();
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 429) throw new RateLimitError();
  if (response.status >= 500) throw new ServerError();
  if (!response.ok) {
    const errorBody = await response.text().catch(() => '');
    throw new NetworkError(`API error ${response.status}: ${errorBody.slice(0, 200) || 'Unknown error'}`);
  }

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ParseError();
  }

  const obj = data as Record<string, unknown>;
  const choices = obj.choices as Array<{
    message: { content: string | null };
  }> | undefined;
  const content = choices?.[0]?.message?.content;
  if (!content) throw new ParseError();

  // Strip markdown code fences if present
  let cleaned = content.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/, '').replace(/\s*```$/, '');
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    throw new ParseError();
  }

  if (!isValidExplanation(parsed)) throw new ParseError();
  return parsed;
}

function isValidExplanation(data: unknown): data is ExplanationResponse {
  if (typeof data !== 'object' || data === null) return false;
  const obj = data as Record<string, unknown>;
  return (
    typeof obj.elementIdentity === 'string' &&
    typeof obj.primaryPurpose === 'string' &&
    typeof obj.whatHappens === 'string' &&
    typeof obj.example === 'string' &&
    Array.isArray(obj.useCases) &&
    obj.useCases.every((item: unknown) => typeof item === 'string')
  );
}

export async function requestFollowup(
  question: string,
  context: { tagName: string; textContent: string } | null,
  history: Array<{ role: string; content: string }>,
): Promise<string> {
  if (!API_KEY) throw new NoApiKeyError();

  const systemPrompt = `You are a helpful UI assistant. The user previously asked about a web element${context ? ` (a <${context.tagName}> with text "${context.textContent}")` : ''}. Answer their follow-up question concisely in plain text (not JSON). Keep answers short and helpful — 2-3 sentences max.`;

  const messages = [
    { role: 'system' as const, content: systemPrompt },
    ...history.map((h) => ({ role: h.role as 'user' | 'assistant', content: h.content })),
    { role: 'user' as const, content: question },
  ];

  const url = 'https://integrate.api.nvidia.com/v1/chat/completions';

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${API_KEY}`,
      },
      body: JSON.stringify({
        model: MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 256,
        stream: false,
      }),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw new NetworkError('Request timed out');
    }
    throw new NetworkError();
  } finally {
    clearTimeout(timeoutId);
  }

  if (!response.ok) throw new ServerError();

  let data: unknown;
  try {
    data = await response.json();
  } catch {
    throw new ParseError();
  }

  const obj = data as Record<string, unknown>;
  const choices = obj.choices as Array<{
    message: { content: string | null };
  }> | undefined;
  const content = choices?.[0]?.message?.content;
  if (!content) throw new ParseError();

  return content.trim();
}
