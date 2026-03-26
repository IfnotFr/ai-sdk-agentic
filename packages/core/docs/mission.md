# Mission & Shared Context 🧠

The Mission system manages the execution lifecycle and provides a shared data space for all agents.

## The `useMission` Hook

Used to retrieve the current mission state from anywhere in your codebase.

```typescript
import { useMission } from "ai-sdk-agentic";

const { id, context, metadata } = useMission();
```

### Properties
| Property | Description |
| :--- | :--- |
| `id` | The unique mission identifier. |
| `context` | A plain object `{}` for sharing data between agents and tools. |
| `metadata` | Immutable data about the mission (e.g., `startTime`). |

## Working with Context

The `context` is a safe, plain JavaScript object (no prototype). It is the source of truth for your mission data.

```typescript
// In Tool A
const { context } = useMission();
context.userAuthenticated = true;

// In Tool B (even if in another agent via Handoff)
const { context } = useMission();
if (context.userAuthenticated) { ... }
```

## Type Safety

Augment the global interface to get full autocompletion:

```typescript
declare module "ai-sdk-agentic" {
  interface AgenticContext {
    storagePath?: string;
    tokensUsed: number;
  }
}
```
