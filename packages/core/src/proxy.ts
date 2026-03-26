import { AgentInstance, AgentPlugin, AgenticMission, AgenticGenerateOptions } from "./types.js";
import { getMission, createMission, runInMission, runWithHooks } from "./mission.js";
import { orchestratePlugins, sequence, wrapTools } from "./plugins.js";
import { proxyModel } from "./model.js";
import { useEvents } from "./events.js";

export { useMission } from "./mission.js";

/**
 * executeAgentWithPlugins: Central orchestration logic for generate/stream calls.
 */
function executeAgentWithPlugins(
  target: AgentInstance,
  originalMethod: Function,
  args: any[],
  intercept: (options: AgenticGenerateOptions, mission: AgenticMission) => Promise<any>
) {
  const generateOptions: AgenticGenerateOptions = args[0] || {};
  const parentMission = getMission();
  
  const mission = createMission(generateOptions, parentMission);
  mission.agent.instance = target;

  return runInMission(mission, async () => {
    // 1. Initialize all plugins and collect their hooks
    const hooks = await intercept(generateOptions, mission);
    
    return runWithHooks(hooks, async () => {
      const events = useEvents();

      // 2. Apply metadata overrides from plugins if any
      if (hooks.options?.agentMetadata) {
        mission.agent.metadata = { 
          ...mission.agent.metadata, 
          ...hooks.options.agentMetadata 
        };
      }

      // 3. Setup model interception (critical for onText/streaming)
      const interceptedModel = proxyModel(target);

      // 4. Merge tools
      const baseTools = (target as any).settings?.tools || {};
      const pluginTools = hooks.options?.tools || {};
      const callTools = generateOptions.tools || {};
      const mergedTools = { ...baseTools, ...callTools, ...pluginTools };

      const bind = <T extends Function>(fn?: T): T | undefined => 
        fn ? ((...args: any[]) => runInMission(mission, () => runWithHooks(hooks, () => fn(...args)))) as unknown as T : undefined;

      const finalOptions = {
        ...generateOptions,
        ...hooks.options,
        model: interceptedModel || generateOptions.model || (target as any).settings?.model,
        tools: mergedTools,
        experimental_onStart: bind(sequence(
          generateOptions.experimental_onStart, 
          hooks.onStart,
          (e: any) => events.emit("agent.start", { mission, ...e })
        )),
        experimental_onStepStart: bind(sequence(
          generateOptions.experimental_onStepStart, 
          hooks.onStepStart,
          (e: any) => events.emit("agent.step.start", { mission, ...e })
        )),
        experimental_onToolCallStart: bind(sequence(
          generateOptions.experimental_onToolCallStart, 
          hooks.onToolCallStart,
          (e: any) => events.emit("agent.tool.start", { mission, ...e })
        )),
        experimental_onToolCallFinish: bind(sequence(
          generateOptions.experimental_onToolCallFinish, 
          hooks.onToolCallFinish,
          (e: any) => events.emit("agent.tool.finish", { mission, ...e })
        )),
        onStepFinish: bind(sequence(
          generateOptions.onStepFinish, 
          hooks.onStepFinish,
          (e: any) => events.emit("agent.step.finish", { mission, ...e })
        )),
        onFinish: bind(sequence(
          generateOptions.onFinish, 
          hooks.onFinish,
          (e: any) => events.emit("agent.finish", { mission, ...e })
        )),
      };

      const originalOnText = hooks.onText;
      hooks.onText = bind(async (text: string) => {
        if (originalOnText) await originalOnText(text);
        events.emit("agent.text", { mission, text });
      });

      wrapTools(finalOptions, hooks);

      // 5. Execution wrapped by plugins
      // We REMOVE the async/await here to return the Stream/Result object immediately
      const execution = async () => {
        try {
          const result = await originalMethod.apply(target, [finalOptions, ...args.slice(1)]);
          return hooks.wrapResult ? hooks.wrapResult(result) : result;
        } catch (error) {
          if (hooks.onError) await hooks.onError(error);
          events.emit("agent.error", { mission, error });
          throw error;
        }
      };
      
      return hooks.wrapAgent ? hooks.wrapAgent(execution as any) : execution();
    });
  });
}

function createAgentProxy(
  agent: AgentInstance,
  intercept: (options: AgenticGenerateOptions, mission: AgenticMission) => Promise<any>
): any {
  return new Proxy(agent, {
    get(target, prop, receiver) {
      const original = Reflect.get(target, prop, receiver);

      if (typeof original === "function" && (prop === "generate" || prop === "stream")) {
        // IMPORTANT: The proxy MUST NOT be async itself to avoid premature resolution
        return (...args: any[]) => executeAgentWithPlugins(target, original, args, intercept);
      }
      return original;
    },
  });
}

export function configureAgent(agent: AgentInstance, plugins: AgentPlugin[]) {
  // Notify plugins about the agent instance (useful for immediate registration/discovery)
  plugins.forEach(plugin => {
    if ((plugin as any).init) {
      (plugin as any).init(agent);
    }
  });

  return createAgentProxy(agent, (generateOptions, mission) => 
    orchestratePlugins(plugins, generateOptions, mission)
  );
}
