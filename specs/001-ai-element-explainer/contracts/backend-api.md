# Backend Proxy API Contract

**Date**: 2026-03-19
**Feature**: 001-ai-element-explainer

## Endpoint

**POST** `https://api.smartcontextui.com/explain`

## Request

**Content-Type**: `application/json`

```json
{
  "tagName": "button",
  "textContent": "Save Draft",
  "ariaLabel": "Save current draft",
  "ariaRole": "button",
  "id": "save-draft-btn",
  "className": "btn btn-primary",
  "title": "Save your work as a draft",
  "placeholder": null,
  "parentSnippet": "<div class=\"toolbar\"><button id=\"save-draft-btn\">Save Draft</button><button>Publish</button></div>",
  "pageTitle": "Edit Post - Dashboard",
  "pagePathname": "/dashboard/posts/edit"
}
```

### Field Constraints

| Field | Required | Max Length |
|-------|----------|-----------|
| tagName | yes | 50 |
| textContent | yes | 200 |
| ariaLabel | no | 200 |
| ariaRole | no | 50 |
| id | no | 100 |
| className | no | 200 |
| title | no | 200 |
| placeholder | no | 200 |
| parentSnippet | yes | 500 |
| pageTitle | yes | 200 |
| pagePathname | yes | 500 |

## Response

### Success (200)

**Content-Type**: `application/json`

```json
{
  "identity": "Save Draft Button",
  "purpose": "Saves the current post content as a draft without publishing it.",
  "useCases": [
    "Saves all current form fields (title, body, tags) to your account as a draft",
    "Preserves work-in-progress content that is not ready for publishing",
    "Triggers field validation — required fields will show errors if empty",
    "Updates the 'Last saved' timestamp shown in the editor toolbar",
    "Does not make the post visible to readers — only you can see drafts"
  ],
  "relatedElements": [
    "Publish button — makes the post live and visible to readers",
    "Discard button — deletes the draft permanently"
  ]
}
```

### Error Responses

| Status | Body | Extension Displays |
|--------|------|--------------------|
| 429 | `{"error": "rate_limit", "message": "Too many requests"}` | "Too many requests — try again shortly." |
| 500 | `{"error": "server_error", "message": "..."}` | "Service temporarily unavailable." |
| 502/503 | `{"error": "service_unavailable", "message": "..."}` | "Service temporarily unavailable." |

### Network Errors

| Condition | Extension Displays |
|-----------|--------------------|
| fetch throws (no internet, DNS failure, timeout) | "Could not connect — check your internet." |
| Response body is not valid JSON | "Could not analyze this element." |
| Response missing required fields (identity, purpose, useCases) | "Could not analyze this element." |

## Request Timeout

The extension sets a fetch timeout of **10 seconds**. If the backend
does not respond within 10 seconds, the request is aborted and the
tooltip shows "Service temporarily unavailable."

## Headers

The extension sends no authentication headers. The backend proxy
identifies requests by origin or extension ID if needed for rate
limiting.
