# 🎙️ VAPI Conversational AI

LogLife uses [VAPI](https://vapi.ai) to enable voice conversations with users. This document explains the three different approaches for implementing conversational AI with VAPI.

---

## 📋 Overview

| Approach | Status | Description |
| :--- | :--- | :--- |
| **Static** | ✅ Supported | AI-driven conversations with no assistant updates (permanent or during call). Only uses `assistantOverrides` for temporary per-call configuration. |
| **Mixed/Hybrid** | ✅ Supported | AI-driven with server tools for user-specific data. Uses `assistantOverrides` for temporary per-call updates. No permanent or during-call assistant updates. |
| **Dynamic** | ❌ Not Yet Supported | Full AI-driven with server tools, `assistantOverrides`, plus real-time assistant updates during calls (system messages, final messages, etc.) |

### 🆕 Dynamic Prompt Injection

LogLife supports **dynamic system prompt injection** that personalizes the VAPI assistant with user-specific context (habits/goals) before each call via `assistantOverrides`.

---

## 📝 Static Approach

AI-driven conversations with fixed assistant configuration. Only `assistantOverrides` can temporarily modify settings per-call.

**Key Points:**
- ✅ AI-driven, no backend integration
- ✅ Fixed configuration, no permanent or during-call updates
- ✅ `assistantOverrides` for per-call customization
- ❌ Cannot fetch user-specific data

---

## 🔀 Mixed/Hybrid Approach (Current Implementation)

AI-driven conversations with server tools to fetch user-specific data. Assistant can call backend APIs to retrieve dynamic information.

**Key Points:**
- ✅ AI-driven with server tools
- ✅ Can fetch user-specific data via tool calls
- ✅ `assistantOverrides` for per-call context injection
- ❌ No permanent or during-call assistant updates

**Current Implementation:**
- Server tools configured to call backend endpoints
- `assistantOverrides` injects user habits/goals before call
- AI uses tool results for personalized responses

---

## 🤖 Dynamic Approach (Not Yet Supported)

Extends Hybrid approach with real-time assistant updates during calls. Includes all Hybrid features plus ability to modify assistant configuration mid-conversation.

**Key Points:**
- ✅ Everything from Hybrid
- ✅ Real-time assistant updates during calls (system messages, final messages, configuration)
- ✅ Adaptive behavior based on conversation progress

---

## 🔧 Technical Details

### Voice Turn Endpoint

**Endpoint**: `POST /voice-turn`

**Headers**: `x-api-key: my-super-secret-123`

**Request**:
```json
{
  "external_user_id": "user_token_or_phone",
  "user_text": "What are my habits?",
  "mode": "daily_checkin"
}
```

**Response**:
```json
{
  "reply_text": "You have 3 habits:\n• 📚 Read 30 mins\n• 💪 Exercise\n• 🧘 Meditate"
}
```

**End Call**: Include `endCall=true` in response text.

### Supported Modes

- `daily_checkin` - Daily habit check-in
- `goal_setup` - Goal setup and configuration
- `temptation_support` - Support during temptation moments
- `onboarding` - New user onboarding

### Additional Endpoints

#### Token Validation

**Endpoint**: `GET /validate-token?token=<token>`

**Response**:
```json
{
  "valid": true,
  "phone_number": "923325727426"
}
```

#### User Habits Retrieval

**Endpoint**: `GET /user-habits?token=<token>`

**Response**:
```json
{
  "habits": "User's current habits:\n- 🎯 Read 30 minutes daily\n..."
}
```

#### Assistant Prompt Modification

**Endpoint**: `GET /api/vapi/assistant/[assistantId]?token=<token>`

Fetches assistant's system prompt and returns modified version with user habits prepended.

**Response**:
```json
{
  "originalPrompt": "You are LogLife Coach...",
  "modifiedPrompt": "User's current habits:\n...\nYou are LogLife Coach..."
}
```

#### VAPI Assistant Admin Panel

**Endpoint**: `GET /vapi-admin`

Web-based admin panel for managing VAPI assistant configurations. Accessible from emulator page.

**API Endpoints**:
- `GET /vapi-admin/api/assistant/<assistant_id>` - Fetch assistant config
- `PATCH /vapi-admin/api/assistant/<assistant_id>` - Update assistant config

**Editable Fields**: `name`, `firstMessage`, `voicemailMessage`, `endCallMessage`, `endCallPhrases`, `model`, `voice`, `transcriber`, `clientMessages`, `serverMessages`

**Read-Only Fields**: `id`, `orgId`, `createdAt`, `updatedAt`, `isServerUrlSecretSet`, `backgroundDenoisingEnabled`, `compliancePlan`, `hipaaEnabled`

### Frontend Integration

The frontend call page (```website/app/call/[number]/[token]/page.tsx```):
- Maps call numbers to VAPI assistant IDs
- Validates user tokens
- Injects user habits via `assistantOverrides` before call
- Passes `external_user_id` to VAPI
- Handles call events

### Dynamic Prompt Injection Flow

1. Validate user token
2. Fetch user habits from database
3. Inject habits into system prompt via `assistantOverrides.model.messages`
4. Start call with personalized configuration

**Example Modified Prompt**:
```
User's current habits:
- 🎯 Read 30 minutes daily
- 💪 Exercise 3 times per week

[Original system prompt continues...]
```

---

## 📚 Related Documentation

- [Core Architecture](architecture.md): Understanding the overall system architecture
- [WhatsApp Flow](whatsapp-flow.md): How WhatsApp integration works
- [API Reference - Routes](../api/backend/routes.md): Detailed API documentation
