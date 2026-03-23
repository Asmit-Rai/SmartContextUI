export interface ElementContext {
  tagName: string;
  textContent: string;
  ariaLabel: string | null;
  role: string | null;
  id: string;
  title: string;
  placeholder: string;
  pagePathname: string;
  pageTitle: string;
  href: string;
  inputType: string;
  className: string;
  parentTag: string;
  parentText: string;
  nearbyText: string;
}

export interface ExplanationResponse {
  elementIdentity: string;
  primaryPurpose: string;
  whatHappens: string;
  example: string;
  useCases: string[];
  relatedElements?: string[];
}

export interface CacheEntry {
  explanation: ExplanationResponse;
  timestamp: number;
}

export interface Settings {
  enabled: boolean;
}

export enum MessageType {
  TRIGGER_FROM_CONTEXT_MENU = 'TRIGGER_FROM_CONTEXT_MENU',
  REQUEST_EXPLANATION = 'REQUEST_EXPLANATION',
  EXPLANATION_RESULT = 'EXPLANATION_RESULT',
  TOGGLE_EXTENSION = 'TOGGLE_EXTENSION',
  FOLLOWUP_QUESTION = 'FOLLOWUP_QUESTION',
  FOLLOWUP_RESULT = 'FOLLOWUP_RESULT',
}

export interface TriggerMessage {
  type: MessageType.TRIGGER_FROM_CONTEXT_MENU;
}

export interface RequestExplanationMessage {
  type: MessageType.REQUEST_EXPLANATION;
  payload: ElementContext;
}

export interface ExplanationResultMessage {
  type: MessageType.EXPLANATION_RESULT;
  payload:
    | { success: true; data: ExplanationResponse }
    | { success: false; error: string };
}

export interface ToggleExtensionMessage {
  type: MessageType.TOGGLE_EXTENSION;
  payload: { enabled: boolean };
}

export interface FollowupQuestionMessage {
  type: MessageType.FOLLOWUP_QUESTION;
  payload: {
    question: string;
    context: { tagName: string; textContent: string } | null;
    history: Array<{ role: string; content: string }>;
  };
}

export interface FollowupResultMessage {
  type: MessageType.FOLLOWUP_RESULT;
  payload: {
    question: string;
    answer: string;
    success: boolean;
  };
}

export type Message =
  | TriggerMessage
  | RequestExplanationMessage
  | ExplanationResultMessage
  | ToggleExtensionMessage
  | FollowupQuestionMessage
  | FollowupResultMessage;
