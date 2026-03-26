import { tool } from "ai";
import { z } from "zod";
import { AgentInstance, AgentPlugin } from "../types.js";

export interface HandoffTarget {
  /** The name of the agent, as seen by the LLM. */
  name: string;
  /** The agent instance to hand off to. */
  agent: AgentInstance;
  /** Optional description to help the LLM understand when to use this agent. */
  description?: string;
  /** The execution mode: 'generate' (default) or 'stream'. */
  mode?: "generate" | "stream";
}

/**
 * withHandoff: Allows an agent to delegate tasks to other agents via a single 'handoff' tool.
 */
export const withHandoff = (targets: HandoffTarget[]): AgentPlugin => {
  const agentNames = targets.map((t) => t.name);
  const targetsMap = new Map(targets.map((t) => [t.name, t]));

  const agentsDescription = targets
    .map((t) => `- ${t.name}: ${t.description || "Specialized agent"}`)
    .join("\n");

  return (generateOptions, mission) => {
    if (targets.length === 0) return {};

    const handoffTool = tool({
      description: `Transfer the mission to another specialized agent. Available agents:\n${agentsDescription}`,
      inputSchema: z.object({
        to: z
          .enum(agentNames as [string, ...string[]])
          .describe("The name of the target agent."),
        prompt: z
          .string()
          .describe("Clear instructions or task for the target agent."),
      }),
      execute: async ({ to, prompt }) => {
        const target = targetsMap.get(to);
        if (!target) {
          return { status: "error", message: `Agent "${to}" not found.` };
        }

        try {
          const mode = target.mode || "generate";
          
          if (mode === "stream") {
            const result = await target.agent.stream({ prompt });
            return await result.text;
          } else {
            const result = await target.agent.generate({ prompt });
            return result.text || "Mission completed by " + to;
          }
        } catch (error: any) {
          return { 
            status: "error", 
            message: `Handoff to "${to}" failed: ${error.message || error}` 
          };
        }
      },
    });

    return {
      options: {
        tools: { ...(generateOptions.tools || {}), handoff: handoffTool },
      },
    };
  };
};
