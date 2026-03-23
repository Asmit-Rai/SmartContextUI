import type { ExplanationResponse } from '../shared/types';
import { MessageType } from '../shared/types';
import type { Message } from '../shared/types';
import { TOOLTIP_CSS } from './tooltip-styles';

const LOGO_SVG = `<svg viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="wha-g1" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
      <stop stop-color="#818cf8"/>
      <stop offset="1" stop-color="#6366f1"/>
    </linearGradient>
    <linearGradient id="wha-g2" x1="8" y1="6" x2="20" y2="22" gradientUnits="userSpaceOnUse">
      <stop stop-color="#c7d2fe"/>
      <stop offset="1" stop-color="#a5b4fc"/>
    </linearGradient>
  </defs>
  <rect width="28" height="28" rx="8" fill="url(#wha-g1)"/>
  <rect x="2" y="2" width="12" height="8" rx="3" fill="url(#wha-g2)" opacity="0.3"/>
  <circle cx="10" cy="13" r="2.2" fill="#fff"/>
  <circle cx="18" cy="13" r="2.2" fill="#fff"/>
  <path d="M9 18.5c0 0 2.5 3 5 3s5-3 5-3" stroke="#fff" stroke-width="1.8" stroke-linecap="round" fill="none"/>
  <circle cx="22" cy="6" r="3" fill="#fbbf24" opacity="0.9"/>
  <path d="M21 5.2l1 0.8 1.5-1.5" stroke="#fff" stroke-width="1" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
</svg>`;

let hostEl: HTMLDivElement | null = null;
let shadowRoot: ShadowRoot | null = null;
let container: HTMLDivElement | null = null;
let bodyEl: HTMLDivElement | null = null;
let followupEl: HTMLDivElement | null = null;
let currentContext: { tagName: string; textContent: string } | null = null;
let conversationHistory: Array<{ role: string; content: string }> = [];

function onKeydown(e: KeyboardEvent): void {
  if (e.key === 'Escape') hide();
}

function onClickOutside(e: MouseEvent): void {
  if (!hostEl) return;
  // Check if the click target is inside our host element.
  // With a closed shadow DOM, e.target for clicks inside the shadow
  // is retargeted to hostEl itself — so that counts as "inside".
  const target = e.target as Node;
  if (hostEl === target || hostEl.contains(target)) return;
  hide();
}

function buildHeader(): HTMLDivElement {
  const header = document.createElement('div');
  header.className = 'wha-header';

  const logo = document.createElement('div');
  logo.className = 'wha-logo';
  logo.innerHTML = LOGO_SVG;
  header.appendChild(logo);

  const brand = document.createElement('span');
  brand.className = 'wha-brand';
  brand.textContent = 'SmartContextUI';
  header.appendChild(brand);

  const closeBtn = document.createElement('button');
  closeBtn.className = 'wha-close';
  closeBtn.innerHTML = '&#10005;';
  closeBtn.addEventListener('click', hide);
  header.appendChild(closeBtn);

  return header;
}

export function create(x: number, y: number): void {
  if (hostEl) hide();

  conversationHistory = [];

  hostEl = document.createElement('div');
  // Stop all clicks inside the host from reaching the document's onClickOutside handler
  hostEl.addEventListener('mousedown', (e) => e.stopPropagation());
  hostEl.addEventListener('click', (e) => e.stopPropagation());
  shadowRoot = hostEl.attachShadow({ mode: 'closed' });

  const style = document.createElement('style');
  style.textContent = TOOLTIP_CSS;
  shadowRoot.appendChild(style);

  container = document.createElement('div');
  container.className = 'wha-tooltip';

  container.appendChild(buildHeader());

  bodyEl = document.createElement('div');
  bodyEl.className = 'wha-body';
  container.appendChild(bodyEl);

  shadowRoot.appendChild(container);
  document.body.appendChild(hostEl);

  position(x, y);

  document.addEventListener('keydown', onKeydown);
  setTimeout(() => document.addEventListener('click', onClickOutside), 0);
}

export function setContext(ctx: { tagName: string; textContent: string }): void {
  currentContext = ctx;
}

export function showLoading(): void {
  if (!bodyEl) return;
  bodyEl.innerHTML = '';

  const loading = document.createElement('div');
  loading.className = 'wha-loading';

  loading.innerHTML = `
    <div class="wha-mascot">
      <div class="wha-mascot-body">
        <div class="wha-mascot-face">
          <div class="wha-mascot-eye"></div>
          <div class="wha-mascot-eye"></div>
        </div>
      </div>
      <div class="wha-mascot-shadow"></div>
    </div>
    <span class="wha-loading-text">Analyzing element</span>
  `;

  bodyEl.appendChild(loading);
}

export function showFollowupLoading(): void {
  if (!bodyEl) return;

  const item = document.createElement('div');
  item.className = 'wha-history-item';
  item.id = 'wha-followup-loading';

  item.innerHTML = `
    <div class="wha-loading" style="padding: 8px 0;">
      <div class="wha-mascot" style="width: 36px; height: 36px;">
        <div class="wha-mascot-body" style="width: 36px; height: 36px; border-radius: 12px;">
          <div class="wha-mascot-face">
            <div class="wha-mascot-eye" style="width: 5px; height: 7px;"></div>
            <div class="wha-mascot-eye" style="width: 5px; height: 7px;"></div>
          </div>
        </div>
        <div class="wha-mascot-shadow" style="width: 24px; bottom: -5px;"></div>
      </div>
      <span class="wha-loading-text" style="font-size: 12px;">Thinking</span>
    </div>
  `;

  bodyEl.appendChild(item);

  // Disable follow-up input while loading
  if (followupEl) {
    const input = followupEl.querySelector('.wha-followup-input') as HTMLInputElement;
    const btn = followupEl.querySelector('.wha-followup-btn') as HTMLButtonElement;
    if (input) input.disabled = true;
    if (btn) btn.disabled = true;
  }

  // Scroll to bottom
  if (container) container.scrollTop = container.scrollHeight;
}

export function showResult(data: ExplanationResponse): void {
  if (!bodyEl || !container) return;
  bodyEl.innerHTML = '';

  // Store the initial explanation in conversation history
  conversationHistory = [
    { role: 'assistant', content: JSON.stringify(data) },
  ];

  const result = document.createElement('div');
  result.className = 'wha-result';

  // Identity
  const identity = document.createElement('div');
  identity.className = 'wha-identity';
  const iconSpan = document.createElement('span');
  iconSpan.className = 'wha-identity-icon';
  iconSpan.textContent = data.elementIdentity.charAt(0).toUpperCase();
  identity.appendChild(iconSpan);
  const identityText = document.createElement('span');
  identityText.textContent = data.elementIdentity;
  identity.appendChild(identityText);
  result.appendChild(identity);

  // Purpose
  const purpose = document.createElement('p');
  purpose.className = 'wha-purpose';
  purpose.textContent = data.primaryPurpose;
  result.appendChild(purpose);

  // What Happens
  if (data.whatHappens) {
    const label = document.createElement('div');
    label.className = 'wha-section-label';
    label.textContent = 'What Happens';
    result.appendChild(label);

    const whatBox = document.createElement('div');
    whatBox.className = 'wha-what-happens';
    whatBox.textContent = data.whatHappens;
    result.appendChild(whatBox);
  }

  // Example
  if (data.example) {
    const label = document.createElement('div');
    label.className = 'wha-section-label';
    label.textContent = 'Example';
    result.appendChild(label);

    const exBox = document.createElement('div');
    exBox.className = 'wha-example';
    exBox.textContent = data.example;
    result.appendChild(exBox);
  }

  // Use Cases
  if (data.useCases.length > 0) {
    const label = document.createElement('div');
    label.className = 'wha-section-label';
    label.textContent = 'Use Cases';
    result.appendChild(label);

    const ol = document.createElement('ol');
    ol.className = 'wha-use-cases';
    for (const uc of data.useCases) {
      const li = document.createElement('li');
      li.textContent = uc;
      ol.appendChild(li);
    }
    result.appendChild(ol);
  }

  // Related Elements
  if (data.relatedElements && data.relatedElements.length > 0) {
    const label = document.createElement('div');
    label.className = 'wha-section-label';
    label.textContent = 'Related Elements';
    result.appendChild(label);

    const ul = document.createElement('ul');
    ul.className = 'wha-related';
    for (const rel of data.relatedElements) {
      const li = document.createElement('li');
      li.textContent = rel;
      ul.appendChild(li);
    }
    result.appendChild(ul);
  }

  bodyEl.appendChild(result);

  // Add follow-up input
  addFollowupInput();
}

export function showFollowupAnswer(question: string, answer: string): void {
  if (!bodyEl || !container) return;

  // Remove loading indicator
  const loadingEl = bodyEl.querySelector('#wha-followup-loading');
  if (loadingEl) loadingEl.remove();

  // Add Q&A to body
  const item = document.createElement('div');
  item.className = 'wha-history-item';

  const q = document.createElement('div');
  q.className = 'wha-question';
  q.textContent = question;
  item.appendChild(q);

  const a = document.createElement('div');
  a.className = 'wha-answer';
  a.textContent = answer;
  item.appendChild(a);

  bodyEl.appendChild(item);

  // Re-enable input
  if (followupEl) {
    const input = followupEl.querySelector('.wha-followup-input') as HTMLInputElement;
    const btn = followupEl.querySelector('.wha-followup-btn') as HTMLButtonElement;
    if (input) { input.disabled = false; input.value = ''; input.focus(); }
    if (btn) btn.disabled = false;
  }

  // Store in history
  conversationHistory.push(
    { role: 'user', content: question },
    { role: 'assistant', content: answer },
  );

  // Scroll to bottom
  container.scrollTop = container.scrollHeight;
}

function addFollowupInput(): void {
  if (!container) return;

  followupEl = document.createElement('div');
  followupEl.className = 'wha-followup';

  const input = document.createElement('input');
  input.className = 'wha-followup-input';
  input.type = 'text';
  input.placeholder = 'Ask a follow-up question...';

  const btn = document.createElement('button');
  btn.className = 'wha-followup-btn';
  btn.innerHTML = '&#10148;';

  const sendFollowup = () => {
    const q = input.value.trim();
    if (!q) return;

    // Add user question display
    const item = document.createElement('div');
    item.className = 'wha-history-item';
    const qDiv = document.createElement('div');
    qDiv.className = 'wha-question';
    qDiv.textContent = q;
    item.appendChild(qDiv);
    bodyEl!.appendChild(item);

    showFollowupLoading();

    chrome.runtime.sendMessage({
      type: MessageType.FOLLOWUP_QUESTION,
      payload: {
        question: q,
        context: currentContext,
        history: conversationHistory,
      },
    } satisfies Message).catch(() => {
      const loadingEl = bodyEl?.querySelector('#wha-followup-loading');
      if (loadingEl) loadingEl.remove();
      showError('Could not send follow-up question.');
    });
  };

  btn.addEventListener('click', sendFollowup);
  // Stop keydown from reaching the document (prevents Escape closing tooltip while typing)
  input.addEventListener('keydown', (e) => {
    e.stopPropagation();
    if (e.key === 'Enter') sendFollowup();
  });

  followupEl.appendChild(input);
  followupEl.appendChild(btn);
  container.appendChild(followupEl);
}

export function showError(message: string): void {
  if (!bodyEl) return;

  const errorDiv = document.createElement('div');
  errorDiv.className = 'wha-error';

  const icon = document.createElement('span');
  icon.className = 'wha-error-icon';
  icon.textContent = '\u26a0';
  errorDiv.appendChild(icon);

  const text = document.createElement('span');
  text.textContent = message;
  errorDiv.appendChild(text);

  bodyEl.innerHTML = '';
  bodyEl.appendChild(errorDiv);
}

export function hide(): void {
  document.removeEventListener('keydown', onKeydown);
  document.removeEventListener('click', onClickOutside);
  if (hostEl && hostEl.parentNode) {
    hostEl.parentNode.removeChild(hostEl);
  }
  hostEl = null;
  shadowRoot = null;
  container = null;
  bodyEl = null;
  followupEl = null;
  currentContext = null;
  conversationHistory = [];
}

export function position(x: number, y: number): void {
  if (!container) return;

  const margin = 12;
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  container.style.left = '0px';
  container.style.top = '0px';
  const rect = container.getBoundingClientRect();
  const w = rect.width;
  const h = rect.height;

  let left = x + margin;
  let top = y + margin;

  if (left + w > vw - margin) {
    left = x - w - margin;
  }
  if (left < margin) {
    left = margin;
  }
  if (top + h > vh - margin) {
    top = y - h - margin;
  }
  if (top < margin) {
    top = margin;
  }

  container.style.left = `${left}px`;
  container.style.top = `${top}px`;
}
