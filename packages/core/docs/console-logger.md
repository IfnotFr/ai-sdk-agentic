# Console Logger 📺

Elegant, structured console output for your agents. It tracks steps, tool calls, and streaming text in real-time.

> **Note**: This plugin uses `process.stdout.write` and is intended for **Node.js environments** only.

## Installation

The `withConsoleLogger` plugin is built-in.

## Usage

```typescript
import { configureAgent, withConsoleLogger } from "ai-sdk-agentic";

const agent = configureAgent(myAgent, [
  withConsoleLogger({
    name: "Support",
    color: "cyan"
  })
]);
```

## Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | The label displayed in brackets (e.g., `[Support]`). |
| `color` | `string` | Chalk color for the prefix. |
| `hideToolInput` | `boolean` | Hide the tool call arguments payload. |
| `hideToolResult` | `boolean` | Hide the tool execution result payload. |

## Features

- **Step Tracking**: Clearly see when a new LLM step starts.
- **Tool Interception**: Logs every tool call with its arguments and safely parses its output (gracefully handling complex custom objects or unstructured data).
- **Streaming Support**: Elegant display of streaming text chunks with a chat-like prefix.
- **Mission Boundaries**: Visually separate different agent executions.
