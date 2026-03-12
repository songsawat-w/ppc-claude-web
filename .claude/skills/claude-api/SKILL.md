---
name: claude-api
description: Build apps with the Claude API or Anthropic SDK
triggers:
  - imports anthropic
  - imports @anthropic-ai/sdk
  - uses Claude API
  - uses Anthropic SDK
  - uses Agent SDK
---

# Claude API / Anthropic SDK

## Model Reference (Current)

| Model | ID | Best For |
|-------|-----|---------|
| Claude Opus 4.6 | `claude-opus-4-6` | Complex reasoning, long context |
| Claude Sonnet 4.6 | `claude-sonnet-4-6` | Balanced speed/quality (default) |
| Claude Haiku 4.5 | `claude-haiku-4-5-20251001` | Fast, lightweight tasks |

**Default to `claude-sonnet-4-6` unless the task specifically requires Opus or Haiku.**

## SDK Setup

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});
```

## Basic Message

```typescript
const message = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Hello, Claude" }],
});
console.log(message.content[0].text);
```

## Streaming

```typescript
const stream = await client.messages.stream({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  messages: [{ role: "user", content: "Tell me a story" }],
});

for await (const chunk of stream) {
  if (
    chunk.type === "content_block_delta" &&
    chunk.delta.type === "text_delta"
  ) {
    process.stdout.write(chunk.delta.text);
  }
}
```

## Tool Use

```typescript
const tools: Anthropic.Tool[] = [
  {
    name: "get_weather",
    description: "Get current weather for a location",
    input_schema: {
      type: "object",
      properties: {
        location: { type: "string", description: "City name" },
      },
      required: ["location"],
    },
  },
];

const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  tools,
  messages: [{ role: "user", content: "What's the weather in Bangkok?" }],
});

// Handle tool use
if (response.stop_reason === "tool_use") {
  const toolUse = response.content.find((c) => c.type === "tool_use");
  // Execute tool and return result
}
```

## System Prompt

```typescript
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: "You are a helpful assistant for a PPC campaign management system.",
  messages: [{ role: "user", content: "..." }],
});
```

## Agent SDK Pattern

```typescript
import { Agent, tool } from "@anthropic-ai/agent-sdk";

const agent = new Agent({
  model: "claude-sonnet-4-6",
  tools: [
    tool({
      name: "search",
      description: "Search the web",
      parameters: { query: { type: "string" } },
      execute: async ({ query }) => {
        // implementation
      },
    }),
  ],
});

const result = await agent.run("Find the latest CPC rates");
```

## Environment Variables

```bash
ANTHROPIC_API_KEY=sk-ant-...
```

## Cost Optimization

- Use `claude-haiku-4-5` for classification, extraction, simple Q&A
- Use `claude-sonnet-4-6` for general tasks (best cost/quality ratio)
- Use `claude-opus-4-6` only for complex multi-step reasoning
- Enable prompt caching for repeated system prompts (up to 90% cost reduction)

```typescript
// Prompt caching example
const response = await client.messages.create({
  model: "claude-sonnet-4-6",
  max_tokens: 1024,
  system: [
    {
      type: "text",
      text: "Very long system prompt...",
      cache_control: { type: "ephemeral" },
    },
  ],
  messages: [...],
});
```

## Error Handling

```typescript
try {
  const response = await client.messages.create({ ... });
} catch (error) {
  if (error instanceof Anthropic.APIError) {
    console.error(error.status, error.message);
    // 429 = rate limit, 529 = overloaded
  }
}
```
