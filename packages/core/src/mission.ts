import { AsyncLocalStorage } from "node:async_hooks";
import { AgenticMission, AgenticHooks } from "./types.js";

const missionStore = new AsyncLocalStorage<AgenticMission>();
const hooksStore = new AsyncLocalStorage<AgenticHooks>();

export function getMission() {
  return missionStore.getStore();
}

export function runInMission<T>(mission: AgenticMission, fn: () => Promise<T>): Promise<T> {
  return missionStore.run(mission, fn);
}

export function getHooks() {
  return hooksStore.getStore();
}

export function runWithHooks<T>(hooks: AgenticHooks, fn: () => Promise<T>): Promise<T> {
  return hooksStore.run(hooks, fn);
}

export function createMission(generateOptions: any, parentMission?: AgenticMission): AgenticMission {
  const now = Date.now();
  const id = parentMission?.id || generateOptions.id || `mission-${now}`;
  
  return {
    id,
    context: parentMission?.context || Object.create(null),
    metadata: {
      ...(parentMission?.metadata || {}),
      id,
      startTime: now
    },

    agent: {
      id: `agent-${now}-${Math.random().toString(36).slice(2, 7)}`,
      metadata: Object.create(null),
      instance: null as any
    }
  };
}

export function useMission() {
  const mission = getMission();
  if (!mission) throw new Error("[ai-sdk-agentic] useMission() must be called within an agent execution.");
  return mission;
}
