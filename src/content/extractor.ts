import type { ElementContext } from '../shared/types';
import { MAX_TEXT_LENGTH } from '../shared/constants';

function trim(str: string, max = MAX_TEXT_LENGTH): string {
  return str.trim().slice(0, max);
}

function getNearbyText(el: Element): string {
  const texts: string[] = [];
  const prev = el.previousElementSibling;
  const next = el.nextElementSibling;
  if (prev?.textContent) texts.push(trim(prev.textContent, 80));
  if (next?.textContent) texts.push(trim(next.textContent, 80));
  return texts.join(' | ');
}

export function extractElementContext(element: Element): ElementContext {
  const htmlEl = element as HTMLElement;
  const parent = element.parentElement;

  return {
    tagName: element.tagName,
    textContent: trim(element.textContent ?? ''),
    ariaLabel: element.getAttribute('aria-label'),
    role: element.getAttribute('role'),
    id: element.id ?? '',
    title: htmlEl.title ?? '',
    placeholder: element.getAttribute('placeholder') ?? '',
    pagePathname: window.location.pathname,
    pageTitle: document.title,
    href: (element as HTMLAnchorElement).href ?? '',
    inputType: element.getAttribute('type') ?? '',
    className: trim(element.className?.toString?.() ?? '', 120),
    parentTag: parent ? `${parent.tagName}${parent.id ? '#' + parent.id : ''}` : '',
    parentText: trim(parent?.textContent ?? '', 100),
    nearbyText: getNearbyText(element),
  };
}
