export const TOOLTIP_CSS = `
  :host {
    all: initial;
  }

  /* ── Claymorphism base ────────────────────────── */
  @keyframes wha-fadeIn {
    from { opacity: 0; transform: translateY(8px) scale(0.96); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  @keyframes wha-bounce {
    0%, 100% { transform: translateY(0); }
    20%  { transform: translateY(-12px) rotate(-5deg); }
    40%  { transform: translateY(-6px) rotate(3deg); }
    60%  { transform: translateY(-10px) rotate(-3deg); }
    80%  { transform: translateY(-3px) rotate(1deg); }
  }

  @keyframes wha-blink {
    0%, 90%, 100% { transform: scaleY(1); }
    95% { transform: scaleY(0.1); }
  }

  @keyframes wha-pulse-ring {
    0%   { transform: scale(0.8); opacity: 0.6; }
    50%  { transform: scale(1.1); opacity: 0.2; }
    100% { transform: scale(0.8); opacity: 0.6; }
  }

  @keyframes wha-dots {
    0%, 20%   { content: ''; }
    40%       { content: '.'; }
    60%       { content: '..'; }
    80%, 100% { content: '...'; }
  }

  @keyframes wha-slideUp {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  .wha-tooltip {
    position: fixed;
    z-index: 2147483647;
    width: 380px;
    max-height: 60vh;
    overflow-y: auto;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(20px);
    -webkit-backdrop-filter: blur(20px);
    color: #1a1a2e;
    border-radius: 24px;
    border: 1px solid rgba(255, 255, 255, 0.6);
    box-shadow:
      8px 8px 24px rgba(149, 157, 165, 0.25),
      -4px -4px 16px rgba(255, 255, 255, 0.8),
      inset 0 1px 0 rgba(255, 255, 255, 0.9);
    padding: 0;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
    font-size: 14px;
    line-height: 1.6;
    box-sizing: border-box;
    animation: wha-fadeIn 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) both;
  }

  /* scrollbar */
  .wha-tooltip::-webkit-scrollbar { width: 6px; }
  .wha-tooltip::-webkit-scrollbar-track { background: transparent; }
  .wha-tooltip::-webkit-scrollbar-thumb {
    background: rgba(0,0,0,0.12);
    border-radius: 3px;
  }

  /* ── Header ──────────────────────────────────── */
  .wha-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 16px 20px 12px;
    border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  }

  .wha-logo {
    width: 28px;
    height: 28px;
    flex-shrink: 0;
  }

  .wha-brand {
    font-size: 14px;
    font-weight: 700;
    background: linear-gradient(135deg, #6366f1, #8b5cf6, #a855f7);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.3px;
  }

  .wha-close {
    margin-left: auto;
    background: rgba(0, 0, 0, 0.05);
    border: none;
    cursor: pointer;
    font-size: 14px;
    color: #888;
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    transition: all 0.2s;
  }

  .wha-close:hover {
    background: rgba(0, 0, 0, 0.1);
    color: #333;
    transform: scale(1.1);
  }

  /* ── Body ─────────────────────────────────────── */
  .wha-body {
    padding: 16px 20px;
  }

  /* ── Loading: Animated mascot ────────────────── */
  .wha-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 14px;
    padding: 24px 0;
  }

  .wha-mascot {
    position: relative;
    width: 56px;
    height: 56px;
    animation: wha-bounce 1.8s ease-in-out infinite;
  }

  .wha-mascot-body {
    width: 56px;
    height: 56px;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    border-radius: 18px;
    box-shadow:
      4px 4px 12px rgba(99, 102, 241, 0.3),
      -2px -2px 8px rgba(255, 255, 255, 0.5),
      inset 0 2px 4px rgba(255, 255, 255, 0.4);
    position: relative;
    overflow: hidden;
  }

  .wha-mascot-body::before {
    content: '';
    position: absolute;
    top: 4px;
    left: 6px;
    width: 40%;
    height: 30%;
    background: rgba(255,255,255,0.25);
    border-radius: 50%;
    transform: rotate(-15deg);
  }

  .wha-mascot-face {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    display: flex;
    gap: 10px;
    align-items: center;
  }

  .wha-mascot-eye {
    width: 8px;
    height: 10px;
    background: #fff;
    border-radius: 50%;
    animation: wha-blink 3s ease-in-out infinite;
    box-shadow: 0 0 4px rgba(255,255,255,0.6);
  }

  .wha-mascot-eye:last-child {
    animation-delay: 0.1s;
  }

  .wha-mascot-shadow {
    position: absolute;
    bottom: -8px;
    left: 50%;
    transform: translateX(-50%);
    width: 40px;
    height: 8px;
    background: radial-gradient(ellipse, rgba(0,0,0,0.12) 0%, transparent 70%);
    animation: wha-pulse-ring 1.8s ease-in-out infinite;
  }

  .wha-loading-text {
    font-size: 13px;
    font-weight: 500;
    color: #6366f1;
    letter-spacing: 0.3px;
  }

  .wha-loading-text::after {
    content: '';
    animation: wha-dots 1.5s steps(1) infinite;
  }

  /* ── Result card ─────────────────────────────── */
  .wha-result {
    animation: wha-slideUp 0.35s ease-out both;
  }

  .wha-identity {
    font-size: 16px;
    font-weight: 700;
    margin: 0 0 6px;
    color: #1e1b4b;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .wha-identity-icon {
    width: 22px;
    height: 22px;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    color: #fff;
    flex-shrink: 0;
    box-shadow: 2px 2px 6px rgba(99, 102, 241, 0.25);
  }

  .wha-purpose {
    margin: 0 0 14px;
    color: #4b5563;
    font-size: 13.5px;
    padding: 10px 14px;
    background: rgba(99, 102, 241, 0.06);
    border-radius: 14px;
    border: 1px solid rgba(99, 102, 241, 0.1);
  }

  .wha-section-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.8px;
    color: #8b5cf6;
    margin: 14px 0 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .wha-section-label::before {
    content: '';
    display: inline-block;
    width: 14px;
    height: 2px;
    background: linear-gradient(90deg, #8b5cf6, transparent);
    border-radius: 1px;
  }

  .wha-what-happens {
    padding: 10px 14px;
    background: rgba(16, 185, 129, 0.06);
    border: 1px solid rgba(16, 185, 129, 0.15);
    border-radius: 14px;
    font-size: 13px;
    color: #065f46;
    line-height: 1.6;
    margin-bottom: 4px;
  }

  .wha-example {
    padding: 10px 14px;
    background: rgba(245, 158, 11, 0.06);
    border: 1px solid rgba(245, 158, 11, 0.15);
    border-radius: 14px;
    font-size: 13px;
    color: #78350f;
    line-height: 1.6;
    font-style: italic;
    margin-bottom: 4px;
  }

  .wha-use-cases {
    margin: 0 0 8px;
    padding: 0;
    list-style: none;
    counter-reset: uc;
  }

  .wha-use-cases li {
    counter-increment: uc;
    margin-bottom: 6px;
    padding: 8px 12px 8px 36px;
    position: relative;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 12px;
    border: 1px solid rgba(0, 0, 0, 0.04);
    box-shadow: 2px 2px 8px rgba(0, 0, 0, 0.04);
    font-size: 13px;
    color: #374151;
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .wha-use-cases li:hover {
    transform: translateY(-1px);
    box-shadow: 3px 3px 12px rgba(0, 0, 0, 0.08);
  }

  .wha-use-cases li::before {
    content: counter(uc);
    position: absolute;
    left: 10px;
    top: 8px;
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #818cf8, #6366f1);
    color: #fff;
    font-size: 11px;
    font-weight: 700;
    border-radius: 7px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 2px 2px 4px rgba(99, 102, 241, 0.2);
  }

  .wha-related {
    margin: 0;
    padding: 0;
    list-style: none;
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .wha-related li {
    padding: 4px 12px;
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(139, 92, 246, 0.15);
    border-radius: 20px;
    font-size: 12px;
    color: #6d28d9;
    font-weight: 500;
  }

  /* ── Follow-up input ────────────────────────── */
  .wha-followup {
    display: flex;
    gap: 8px;
    padding: 12px 20px 16px;
    border-top: 1px solid rgba(0, 0, 0, 0.06);
    animation: wha-slideUp 0.4s ease-out 0.2s both;
  }

  .wha-followup-input {
    flex: 1;
    padding: 10px 14px;
    border: 1.5px solid rgba(99, 102, 241, 0.2);
    border-radius: 14px;
    font-size: 13px;
    font-family: inherit;
    color: #1a1a2e;
    background: rgba(255, 255, 255, 0.8);
    outline: none;
    transition: border-color 0.2s, box-shadow 0.2s;
  }

  .wha-followup-input:focus {
    border-color: #818cf8;
    box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
  }

  .wha-followup-input::placeholder {
    color: #a5b4c8;
  }

  .wha-followup-btn {
    width: 38px;
    height: 38px;
    border: none;
    border-radius: 14px;
    background: linear-gradient(135deg, #6366f1, #8b5cf6);
    color: #fff;
    font-size: 16px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow:
      3px 3px 10px rgba(99, 102, 241, 0.3),
      -1px -1px 4px rgba(255, 255, 255, 0.3);
    transition: transform 0.15s, box-shadow 0.15s;
  }

  .wha-followup-btn:hover {
    transform: translateY(-1px);
    box-shadow:
      4px 4px 14px rgba(99, 102, 241, 0.4),
      -1px -1px 4px rgba(255, 255, 255, 0.3);
  }

  .wha-followup-btn:active {
    transform: translateY(0) scale(0.96);
  }

  .wha-followup-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Error card ──────────────────────────────── */
  .wha-error {
    background: rgba(254, 202, 202, 0.3);
    border: 1px solid rgba(252, 165, 165, 0.4);
    border-radius: 14px;
    padding: 14px 16px;
    color: #991b1b;
    font-size: 13px;
    display: flex;
    align-items: flex-start;
    gap: 10px;
    box-shadow: 2px 2px 8px rgba(239, 68, 68, 0.08);
  }

  .wha-error-icon {
    font-size: 16px;
    flex-shrink: 0;
    margin-top: 1px;
  }

  /* ── Conversation history ────────────────────── */
  .wha-history-item {
    margin-top: 14px;
    padding-top: 14px;
    border-top: 1px dashed rgba(0, 0, 0, 0.08);
    animation: wha-slideUp 0.35s ease-out both;
  }

  .wha-question {
    font-size: 12.5px;
    font-weight: 600;
    color: #6366f1;
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .wha-answer {
    font-size: 13px;
    color: #4b5563;
    line-height: 1.6;
    padding: 10px 14px;
    background: rgba(99, 102, 241, 0.04);
    border-radius: 14px;
    border: 1px solid rgba(99, 102, 241, 0.08);
  }
`;
