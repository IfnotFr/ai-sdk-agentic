# ai-sdk-agentic (Core) 🤖

The core package of the **AI SDK Agentic** framework. This package provides the low-level immutable proxy, the global event bus, and the `AgenticHooks` infrastructure.

> **Note:** For general usage, installation, and built-in plugins (`withHandoff`, `withConsoleLogger`), please refer to the [Global Documentation](../../README.md).

## Create Your Own Plugin

Plugins are simple functions that receive the current `AgenticMission` and return `AgenticHooks`. They allow you to modify options, intercept prompts, or wrap execution.

### Plugin Hooks Reference

#### Specialized Hooks

| Hook | Signature | Description |
| :--- | :--- | :--- |
| `onText` | `(text: string) => void \| Promise<void>` | Intercept real-time text chunks. |
| `wrapAgent` | `(proceed: () => Promise<any>) => Promise<any>` | Wraps the entire `generate`/`stream` call. |
| `wrapTool` | `(proceed: () => Promise<any>, info: { toolName: string, args: any, toolCallId?: string, parameters: any }) => Promise<any>` | Wraps every individual tool execution. |
| `wrapResult` | `(result: any) => any` | Modifies the final agent output object before returning it. |
| `transformPrompt` | `(params: any) => any \| Promise<any>` | Modifies LLM parameters (system, prompt, messages) before the call. |
| `onError` | `(error: any) => void \| Promise<void>` | Called when the agent execution crashes. |
| `options` | `any` | Object to inject or override default agent options (e.g., additional tools). |

#### Lifecycle Hooks (Stable API)

These hooks map exactly to the [Vercel AI SDK lifecycle callbacks](https://ai-sdk.dev/docs/agents/building-agents#lifecycle-callbacks).

| Hook | Signature | Native Mapping | Description |
| :--- | :--- | :--- | :--- |
| `onStart` | `(event: OnStartEvent) => void \| Promise<void>` | `experimental_onStart` | Mission begins. |
| `onStepStart` | `(event: OnStepStartEvent) => void \| Promise<void>` | `experimental_onStepStart` | Before each LLM step. |
| `onToolCallStart` | `(event: OnToolCallStartEvent) => void \| Promise<void>` | `experimental_onToolCallStart` | Before a tool is called. |
| `onToolCallFinish`| `(event: OnToolCallFinishEvent) => void \| Promise<void>`| `experimental_onToolCallFinish`| After a tool has finished. |
| `onStepFinish` | `(event: OnStepFinishEvent) => void \| Promise<void>` | `onStepFinish` | End of each step. |
| `onFinish` | `(event: OnFinishEvent) => void \| Promise<void>` | `onFinish` | Entire mission completed. |

### Example: Custom Logger Plugin

```typescript
export const withSimpleLogger: AgentPlugin = (options, mission) => ({
  onStart: ({ model }) => {
    console.log(`Mission ${mission.id} started with model ${model.modelId}`);
  },
  onText: (text) => {
    process.stdout.write(text);
  },
  onFinish: ({ totalUsage }) => {
    console.log(`Mission finished. Total tokens: ${totalUsage.totalTokens}`);
  },
});
```

### Example: Tool Retry Plugin

```typescript
export const withRetry: AgentPlugin = () => ({
  wrapTool: async (proceed, { toolName }) => {
    let attempts = 0;
    while (attempts < 3) {
      try {
        return await proceed(); // Triggers the actual tool execution
      } catch (err) {
        attempts++;
        console.warn(`Retry ${toolName} (Attempt ${attempts}/3)`);
        if (attempts === 3) throw err;
      }
    }
  },
});
```

## License

MIT
