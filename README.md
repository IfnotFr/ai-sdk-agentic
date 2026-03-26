<div align="center">
  <h1>🤖 AI SDK Agentic</h1>
  <p><strong>Plug-and-play agent framework & fun 2D visualization for Vercel AI SDK.</strong></p>
  
  [![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)
  [![NPM Version](https://img.shields.io/npm/v/ai-sdk-agentic.svg)](https://npmjs.com/package/ai-sdk-agentic)
  
</div>

## What is AI SDK Agentic?

AI SDK Agentic is a developer-first **plugin framework** that seamlessly intercepts and supercharges your Vercel AI SDK calls, unlocking community extensions, multi-agent capabilities, and real-time visual monitoring.

It provides a **100% safe, plug-and-play architecture**:
- 🛡️ **Zero API Mutation**: It wraps Vercel's agents in an immutable proxy without altering the base API.
- ⚡ **Event-Driven Lifecycle**: Unlocks hooks (`onStep`, `onTool`) to track everything in real-time.
- 🧩 **Extensible Plugins**: Easily attach collaborative handoff mechanisms, custom loggers, or our **fun 2D virtual office** without breaking any existing code.


## ⚡ Quick Start

Install the core orchestration package:

```bash
npm install ai-sdk-agentic
```

Wrap your standard Vercel AI agents with `configureAgent` to unlock shared state and multi-agent routing:

```typescript
import { configureAgent, withConsoleLogger, withHandoff } from "ai-sdk-agentic";
import { researcherAgent, writerAgent } from "./agents.js"; // Your standard ai/core agents

export const supervisor = configureAgent(researcherAgent, [
  withConsoleLogger({ name: "Supervisor", color: "cyan" }),
  withHandoff([
    { name: "writer", agent: writerAgent, description: "Writes the final report", mode: "stream" }
  ])
]);

// Run the agent like usual using native Vercel AI SDK methods
await supervisor.generate({
  prompt: "Research black holes and ask the writer to summarize it.",
});
```

## 🧩 Built-in Core Plugins

AI SDK Agentic comes with a set of powerful pre-built plugins ready to use:

### Collaborative Routing (`withHandoff`)
Injects a specialized tool allowing your agents to dynamically delegate tasks to other agents. It seamlessly transfers context and supports streaming out-of-the-box.

### Visual Monitoring (`withConsoleLogger`)
Provides an elegant, structured terminal output for your agent's lifecycle. It automatically color-codes steps, tracks tool executions, and handles real-time text streaming.

## 📡 The Event Bus (`useEvents`)

All agent activities (lifecycle steps, tool calls, text streaming, custom logs) are emitted natively to a central global Event Bus. 

```typescript
import { useEvents } from "ai-sdk-agentic";

const events = useEvents();

events.on("agent.text", ({ text, mission }) => {
  console.log(`[${mission.id}] ${text}`);
});

events.on("agent.tool.start", (payload) => {
  console.log(`Calling tool: ${payload.toolCall.toolName}`);
});
```
*(This Event Bus is what `ai-sdk-office-server` uses under the hood to stream data to your UI).*

## 🧠 Shared Context (`useMission`)

Need to share variables between tools without passing them explicitly? Access a global, strongly-typed state anywhere in your execution tree.

```typescript
import { tool } from "ai";
import { useMission } from "ai-sdk-agentic";

export const databaseTool = tool({
  execute: async (args) => {
    // Safely reads/writes to the context belonging ONLY to the current agent execution
    useMission().context.tokensUsed += 100;
  },
});
```

_See the `packages/core` directory for complete documentation on context injection, events, and the AgentHandoff architecture._

## 📦 Packages & Ecosystem

This repository is a monorepo containing multiple interconnected components.

### NPM Packages

| Package                                                   | Version                                                                                                             | Description                                                                                                                    |
| :-------------------------------------------------------- | :------------------------------------------------------------------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------- |
| [`ai-sdk-agentic`](./packages/core)                       | [![npm](https://img.shields.io/npm/v/ai-sdk-agentic.svg)](https://www.npmjs.com/package/ai-sdk-agentic)             | The core plugin system and orchestration layer. Provides `configureAgent`, shared contexts (`runInMission`), and an event-driven hook lifecycle. |
| [`ai-sdk-office-server`](./packages/ai-sdk-office-server) | [![npm](https://img.shields.io/npm/v/ai-sdk-office-server.svg)](https://www.npmjs.com/package/ai-sdk-office-server) | The bridge server for visualizing agents. It streams real-time `Agentic` events through WebSockets to a UI.                    |

### Apps

| App                    | Description                                                                                                                                                           |
| :--------------------- | :-------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `ai-sdk-office`        | The 2D isometric Visualizer UI (built with Nuxt & Phaser) that connects to `ai-sdk-office-server`. Watch your agents walk around, think, and collaborate in real-time. |
| `docs` _(coming soon)_ | The official website and documentation.                                                                                                                               |

## Development & Contributing

### Setup the Monorepo

We use standard `npm workspaces`.

1. Clone the repository:

   ```bash
   git clone https://github.com/anaelfavre/ai-sdk-agentic.git
   cd ai-sdk-agentic
   ```

2. Install all dependencies (this automatically links cross-package dependencies):

   ```bash
   npm install
   ```

3. Build all packages:
   ```bash
   npm run build
   ```

## License

MIT © Anael Favre
