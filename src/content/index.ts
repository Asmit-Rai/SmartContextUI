import { MessageType } from '../shared/types';
import type { Message, ExplanationResultMessage, FollowupResultMessage } from '../shared/types';
import { extractElementContext } from './extractor';
import * as tooltip from './tooltip';

let lastX = 0;
let lastY = 0;

document.addEventListener('contextmenu', (e: MouseEvent) => {
  lastX = e.clientX;
  lastY = e.clientY;
});

chrome.runtime.onMessage.addListener((message: Message) => {
  if (message.type === MessageType.TRIGGER_FROM_CONTEXT_MENU) {
    handleTrigger();
  }

  if (message.type === MessageType.EXPLANATION_RESULT) {
    const msg = message as ExplanationResultMessage;
    if (msg.payload.success) {
      tooltip.showResult(msg.payload.data);
    } else {
      tooltip.showError(msg.payload.error);
    }
  }

  if (message.type === MessageType.FOLLOWUP_RESULT) {
    const msg = message as FollowupResultMessage;
    if (msg.payload.success) {
      tooltip.showFollowupAnswer(msg.payload.question, msg.payload.answer);
    } else {
      tooltip.showFollowupAnswer(msg.payload.question, msg.payload.answer);
    }
  }
});

function handleTrigger(): void {
  const element = document.elementFromPoint(lastX, lastY);
  if (!element) {
    tooltip.create(lastX, lastY);
    tooltip.showError('Could not identify element at this position.');
    return;
  }

  const context = extractElementContext(element);
  tooltip.create(lastX, lastY);
  tooltip.setContext({ tagName: context.tagName, textContent: context.textContent });
  tooltip.showLoading();

  chrome.runtime.sendMessage({
    type: MessageType.REQUEST_EXPLANATION,
    payload: context,
  } satisfies Message).catch(() => {
    tooltip.showError('Could not reach background service — try reloading the extension.');
  });
}
