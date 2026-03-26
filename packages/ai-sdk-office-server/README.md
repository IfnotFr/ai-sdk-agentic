# AI SDK Office Server 🏢

Bridge between `ai-sdk-agentic` and the Agentic Office visualization frontend. 

This package allows you to visualize your AI agents, their tools, and their lifecycle events in a virtual office environment through WebSockets.

## Installation

```bash
npm install ai-sdk-office-server ai-sdk-agentic
```

## Quick Start (Standalone Server)

If you don't have an existing server, `ai-sdk-office-server` can spawn one for you on port `3010`:

```typescript
import { configureAgent } from "ai-sdk-agentic";
import { useOfficeServer, withOffice } from "ai-sdk-office-server";
import { myAgent } from "./my-agent.js"; // Your Vercel AI SDK agent

// 1. Start the WebSocket Relay Server
const server = useOfficeServer({ port: 3010 });
server.listen();

// 2. Attach your agents to the Office
export const worker = configureAgent(myAgent, [
  withOffice({
    id: "worker_1",             // Unique identifier in the office
    name: "AI Worker",          // Display name
    idlePosition: "desk",       // Where the agent waits
    thinkingPosition: "board",  // Where the agent thinks
  })
]);
```

## Advanced usage (Attach to existing HTTP Server)

If you already have a Node.js `http.Server` (Next.js custom server, Express, Fastify, Nest, etc.), you can attach the Office Server directly without opening a new port:

```typescript
import express from "express";
import { createServer } from "node:http";
import { useOfficeServer } from "ai-sdk-office-server";

const app = express();
const httpServer = createServer(app);

// Gracefully attach Socket.io to your existing server
useOfficeServer({ 
  server: httpServer,
  cors: { origin: "https://my-domain.com" } // Configure CORS natively
});

httpServer.listen(8080);
```

## Configuration Options

When calling `useOfficeServer(options)`, you can pass:

| Option   | Type                  | Description                                                                 |
| :------- | :-------------------- | :-------------------------------------------------------------------------- |
| `port`   | `number`              | Port to listen on (Default: `3010`). Ignored if `server` is provided.       |
| `server` | `http.Server`         | An existing Node.js HTTP server to bind the Socket.io WebSocket to.         |
| `cors`   | `any`                 | Customize the CORS policy (Default: `{ origin: "*", methods: ["GET", "POST"] }`). |
| `debug`  | `boolean`             | If `true`, logs all forwarded agentic events to the console (Default: `false`).|

## License

MIT
