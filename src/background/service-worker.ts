import { MessageType } from '../shared/types';
import type { ElementContext, Message, FollowupQuestionMessage } from '../shared/types';
import { CONTEXT_MENU_ID, CACHE_CLEANUP_INTERVAL_MINUTES } from '../shared/constants';
import { getCached, setCached, clearExpired } from '../shared/cache';
import { getSettings } from '../shared/settings';
import {
  requestExplanation,
  requestFollowup,
  NetworkError,
  RateLimitError,
  ServerError,
  ParseError,
  NoApiKeyError,
} from './api-client';

function sendToTab(tabId: number, message: Message): void {
  chrome.tabs.sendMessage(tabId, message).catch(() => {
    // Content script not loaded in this tab — ignore
  });
}

function createContextMenu(): void {
  chrome.contextMenus.create(
    {
      id: CONTEXT_MENU_ID,
      title: 'SmartContextUI',
      contexts: ['all'],
    },
    () => {
      if (chrome.runtime.lastError) { /* intentional */ }
    },
  );
}

// Register context menu on every service worker startup
getSettings().then((settings) => {
  if (settings.enabled) {
    createContextMenu();
  }
});

chrome.runtime.onInstalled.addListener(() => {
  createContextMenu();
  chrome.alarms.create('clear-expired-cache', {
    periodInMinutes: CACHE_CLEANUP_INTERVAL_MINUTES,
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== CONTEXT_MENU_ID) return;
  if (!tab?.id) return;
  sendToTab(tab.id, { type: MessageType.TRIGGER_FROM_CONTEXT_MENU });
});

chrome.runtime.onMessage.addListener((message: Message, sender) => {
  if (message.type === MessageType.REQUEST_EXPLANATION) {
    const tabId = sender.tab?.id;
    if (!tabId) return false;
    handleExplanationRequest(message.payload, tabId);
    return true;
  }

  if (message.type === MessageType.FOLLOWUP_QUESTION) {
    const tabId = sender.tab?.id;
    if (!tabId) return false;
    handleFollowupRequest(message as FollowupQuestionMessage, tabId);
    return true;
  }

  if (message.type === MessageType.TOGGLE_EXTENSION) {
    if (message.payload.enabled) {
      createContextMenu();
    } else {
      chrome.contextMenus.remove(CONTEXT_MENU_ID, () => {
        if (chrome.runtime.lastError) { /* intentional */ }
      });
    }
  }

  return false;
});

async function handleExplanationRequest(
  context: ElementContext,
  tabId: number,
): Promise<void> {
  try {
    const cached = await getCached(context);
    if (cached) {
      sendToTab(tabId, {
        type: MessageType.EXPLANATION_RESULT,
        payload: { success: true, data: cached },
      });
      return;
    }

    const result = await requestExplanation(context);
    await setCached(context, result);
    sendToTab(tabId, {
      type: MessageType.EXPLANATION_RESULT,
      payload: { success: true, data: result },
    });
  } catch (err) {
    let errorMessage = 'Could not analyze this element.';
    if (err instanceof NoApiKeyError) {
      errorMessage = 'No API key configured \u2014 check the .env file and rebuild.';
    } else if (err instanceof NetworkError) {
      errorMessage = 'Could not connect \u2014 check your internet.';
    } else if (err instanceof RateLimitError) {
      errorMessage = 'Too many requests \u2014 try again shortly.';
    } else if (err instanceof ServerError) {
      errorMessage = 'Service temporarily unavailable.';
    } else if (err instanceof ParseError) {
      errorMessage = 'Could not analyze this element.';
    }
    sendToTab(tabId, {
      type: MessageType.EXPLANATION_RESULT,
      payload: { success: false, error: errorMessage },
    });
  }
}

async function handleFollowupRequest(
  message: FollowupQuestionMessage,
  tabId: number,
): Promise<void> {
  const { question, context, history } = message.payload;
  try {
    const answer = await requestFollowup(question, context, history);
    sendToTab(tabId, {
      type: MessageType.FOLLOWUP_RESULT,
      payload: { question, answer, success: true },
    });
  } catch {
    sendToTab(tabId, {
      type: MessageType.FOLLOWUP_RESULT,
      payload: { question, answer: 'Sorry, I could not process your follow-up question. Please try again.', success: false },
    });
  }
}

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === 'clear-expired-cache') {
    clearExpired();
  }
});
