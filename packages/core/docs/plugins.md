# Plugins & Extension 🛠️

`ai-sdk-agentic` is built on a plugin architecture. Plugins can intercept every part of an agent's execution.

## Using Built-in Plugins

- [Logging](./logging.md): Console output and persistence.
- [Handoff](./handoff.md): Multi-agent delegation.
- [Events](./events.md): Integration with a global event bus.

## Creating Custom Plugins

A plugin is a function that receives the `options` and `mission` and returns `AgenticHooks`.

```typescript
import { AgentPlugin } from "ai-sdk-agentic";

export const withMyFeature = (options: any): AgentPlugin => (userOptions, mission) => {
  return {
    onStart: () => console.log("Mission started"),
    onText: (text) => console.log("New text chunk"),
    wrapTool: async (proceed, info) => {
      console.log(`Calling tool: ${info.toolName}`);
      return await proceed();
    }
  };
};
```

### Available Hooks

| Hook | Type | Description |
| :--- | :--- | :--- |
| `onStart`, `onFinish` | Lifecycle | Mission boundaries. |
| `onStepStart`, `onStepFinish` | Lifecycle | LLM interaction steps. |
| `onToolCallStart`, `onToolCallFinish` | Lifecycle | Tool execution boundaries. |
| `onText` | Streaming | Real-time text chunks. |
| `wrapTool`, `wrapAgent` | Interceptor | Modify or retry execution. |
| `wrapResult` | Interceptor | Modify the final agent result before returning. |
| `transformPrompt` | Interceptor | Modify prompt/system parameters. |
| `onError` | Interceptor | Catch execution crashes. |
| `options` | Injection | Add tools or modify agent settings. |
