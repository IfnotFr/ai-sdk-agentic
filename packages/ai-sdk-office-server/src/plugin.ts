import { AgentPlugin, useEvents } from "ai-sdk-agentic";
import { officeRegistry } from "./registry.js";

export interface WithOfficeOptions {
  /** The unique ID of the agent in the office. If provided, the agent is treated as a singleton. */
  id?: string;
  /** The display name of the agent */
  name?: string;
  /** The ID of the position where the agent returns when idle. If null/undefined, the agent leaves the scene. */
  idlePosition?: string | null;
  /** The ID of the position where the agent goes to think between tool calls. */
  thinkingPosition?: string | null;
}

/**
 * withOffice: Specific plugin for Agentic Office integration.
 * Manages virtual office behaviors and enables event streaming.
 */
export const withOffice = (options: WithOfficeOptions): AgentPlugin => {
  const agentId = options.id || "anonymous";
  const agentName = options.name || agentId;
  const positions = [options.idlePosition, options.thinkingPosition].filter(Boolean) as string[];
  
  // Keep track of tools discovered so far
  let discoveredTools: string[] = [];

  /**
   * Internal Registration Logic
   */
  const register = (agentInstance?: any, runtimeTools?: string[]) => {
    // 1. Static registration of positions
    positions.forEach(p => officeRegistry.registerPosition(p));

    // 2. Tool discovery
    const baseTools = agentInstance ? Object.keys(agentInstance.tools || agentInstance.settings?.tools || agentInstance.options?.tools || {}) : [];
    const extraTools = runtimeTools || [];
    
    // Merge and remove duplicates
    discoveredTools = Array.from(new Set([...discoveredTools, ...baseTools, ...extraTools]));

    // 3. Register Agent in the shared registry
    officeRegistry.registerAgent({
      id: agentId,
      name: agentName,
      tools: discoveredTools,
      positions
    });

    return discoveredTools;
  };

  // Create the plugin function
  const plugin: any = async (generateOptions: any, mission: any) => {
    // Inject office-specific metadata for the UI
    mission.agent.metadata.office = options;

    // Runtime Sync (to handle dynamic tools if any)
    const events = useEvents();
    const runtimeTools = Object.keys(generateOptions.tools || {});
    
    const finalTools = register(mission.agent.instance, runtimeTools);

    // Broadcast update via events for active missions
    events.emit("office.agent.register", {
      id: agentId,
      name: agentName,
      tools: finalTools,
      positions
    });

    return {};
  };

  /**
   * EXCLUSIVE: Self-initialization when attached via configureAgent
   */
  plugin.init = (agentInstance: any) => {
    register(agentInstance);
  };

  return plugin as AgentPlugin;
};
