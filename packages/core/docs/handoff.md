# Agent Handoff 🤝

Allows an agent to delegate tasks to other specialized agents via a `handoff` tool.

## Installation

The `withHandoff` plugin is built-in.

## Usage

Define a list of available agents as a configuration array.

```typescript
import { configureAgent, withHandoff } from "ai-sdk-agentic";

const agent = configureAgent(mainAgent, [
  withHandoff([
    { 
      name: "researcher", 
      agent: researcherAgent, 
      description: "Expert in finding technical documentation." 
    },
    { 
      name: "coder", 
      agent: coderAgent, 
      mode: "stream", // Use streaming for this specific agent
      description: "Can write and fix TypeScript code." 
    }
  ])
]);
```

## How it works

1. `ai-sdk-agentic` injects a tool named `handoff` into the agent's toolset.
2. The tool description includes the names and descriptions of all target agents.
3. When the LLM decides to hand off, it provides the name of the target agent and a prompt.
4. The target agent is executed (using `generate` or `stream` based on the configuration).
5. The result is returned to the original agent (if the target agent returns empty text, `handoff` resolves automatically with a "Mission completed" fallback).

## Configuration Options

| Property | Type | Description |
| :--- | :--- | :--- |
| `name` | `string` | **Required**. The name of the agent for the LLM. |
| `agent` | `AgentInstance` | **Required**. The actual agent proxy/instance. |
| `description` | `string` | Optional. Helps the LLM know when to call this agent. |
| `mode` | `'generate' \| 'stream'`| Optional. Default: `'generate'`. |
