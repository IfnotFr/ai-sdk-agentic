# Event Bus & Observability 📡

All agent activities are broadcasted to a central **Event Bus**. This allows for easy integration with third-party tools, custom UI updates, or logging services.

## Using the Event Bus

Access the global bus using `useEvents()`.

```typescript
import { useEvents } from "ai-sdk-agentic";

const events = useEvents();

events.on("agent.start", ({ mission }) => {
  console.log(`Mission ${mission.id} started`);
});
```

## Available Events

| Event | Payload Type | Description |
| :--- | :--- | :--- |
| `agent.start` | `AgentStartPayload` | When a `generate` or `stream` call begins. |
| `agent.finish` | `AgentFinishPayload`| When the entire execution is completed. |
| `agent.error` | `AgentErrorPayload` | When an error occurs during execution. |
| `agent.text` | `AgentTextPayload` | Real-time text chunks from the LLM. |
| `agent.log` | `AgentLogPayload` | Structured logs from tools or plugins. |
| `agent.step.start` | `AgentStepStartPayload` | Before an LLM step. |
| `agent.step.finish` | `AgentStepFinishPayload`| After an LLM step ends. |
| `agent.tool.start` | `AgentToolCallStartPayload` | Before a tool execution. |
| `agent.tool.finish` | `AgentToolCallFinishPayload`| After a tool execution completes. |

## Custom Logs

You can emit custom logs from anywhere in your codebase using `useEvents()`.

```typescript
import { useEvents } from "ai-sdk-agentic";

const events = useEvents();

// These will be emitted as 'agent.log' events
events.info("Retrieved database results");
events.error("Failed to connect to API");
```

## Integration Example

You can easily relay events to your own monitoring system:

```typescript
import { useEvents } from "ai-sdk-agentic";

useEvents().on("*", (name, payload) => {
  mySentryClient.addBreadcrumb({
    category: "agentic",
    message: name,
    data: payload
  });
});
```
