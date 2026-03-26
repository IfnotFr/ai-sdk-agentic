import { AgentPlugin, AgenticHooks, AgenticMission } from "./types.js";

/**
 * sequence: Executes multiple functions in order.
 * Used for lifecycle events (onStart, onFinish, etc.)
 */
export function sequence<T extends (...args: any[]) => any>(...fns: Array<T | undefined>): T | undefined {
  const filtered = fns.filter((f): f is T => typeof f === "function");
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];

  return (async (...args: Parameters<T>) => {
    for (const fn of filtered) await fn(...args);
  }) as unknown as T;
}

/**
 * waterfall: Passes the result of one function to the next.
 * Used for transformations (transformPrompt, wrapResult).
 */
export function waterfall<T extends (arg: any) => any>(...fns: Array<T | undefined>): T | undefined {
  const filtered = fns.filter((f): f is T => typeof f === "function");
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];

  return (async (initial: any) => {
    let current = initial;
    for (const fn of filtered) current = await fn(current);
    return current;
  }) as unknown as T;
}

/**
 * composeMiddleware: Implements the "onion" pattern for wrappers.
 * Used for wrapAgent and wrapTool.
 */
export function composeMiddleware<T extends (proceed: () => Promise<any>, ...args: any[]) => Promise<any>>(
  ...middlewares: Array<T | undefined>
): T | undefined {
  const filtered = middlewares.filter((f): f is T => typeof f === "function");
  if (filtered.length === 0) return undefined;
  if (filtered.length === 1) return filtered[0];

  return (async (proceed: () => Promise<any>, ...args: any[]) => {
    let index = -1;
    const dispatch = async (i: number): Promise<any> => {
      if (i <= index) throw new Error("next() called multiple times");
      index = i;
      const fn = i === filtered.length ? proceed : filtered[i];
      if (!fn) return;
      return fn(i === filtered.length ? proceed : () => dispatch(i + 1), ...args);
    };
    return dispatch(0);
  }) as unknown as T;
}

export async function orchestratePlugins(
  plugins: AgentPlugin[], 
  generateOptions: any, 
  mission: AgenticMission
): Promise<AgenticHooks> {
  const results: AgenticHooks[] = [];
  let currentOptions = { ...generateOptions };

  // 1. Collect all hooks from plugins
  for (const plugin of plugins) {
    const hooks = await plugin(currentOptions, mission);
    results.push(hooks);
    if (hooks.options) currentOptions = { ...currentOptions, ...hooks.options };
  }

  // 2. Compose each hook type using our utilities
  return {
    onStart: sequence(...results.map(r => r.onStart)),
    onStepStart: sequence(...results.map(r => r.onStepStart)),
    onToolCallStart: sequence(...results.map(r => r.onToolCallStart)),
    onToolCallFinish: sequence(...results.map(r => r.onToolCallFinish)),
    onStepFinish: sequence(...results.map(r => r.onStepFinish)),
    onFinish: sequence(...results.map(r => r.onFinish)),
    onError: sequence(...results.map(r => r.onError)),
    onText: sequence(...results.map(r => r.onText)),
    
    transformPrompt: waterfall(...results.map(r => r.transformPrompt)),
    wrapResult: waterfall(...results.map(r => r.wrapResult)),

    wrapAgent: composeMiddleware(...results.map(r => r.wrapAgent)),
    wrapTool: composeMiddleware(...results.map(r => r.wrapTool)),

    options: currentOptions
  };
}

export function wrapTools(finalOptions: any, hooks: AgenticHooks) {
  const { wrapTool } = hooks;
  if (!wrapTool || !finalOptions.tools) return;

  const originalTools = finalOptions.tools;
  const wrappedTools: any = {};
  for (const [toolName, tool] of Object.entries(originalTools)) {
    const originalTool = tool as any;
    if (!originalTool.execute) {
      wrappedTools[toolName] = tool;
      continue;
    }

    wrappedTools[toolName] = {
      ...originalTool,
      execute: async (args: any, info: any) => {
        return wrapTool(
          () => originalTool.execute(args, info), 
          { 
            toolName, 
            args, 
            toolCallId: info?.toolCallId,
            parameters: originalTool.parameters
          }
        );
      }
    };
  }
  finalOptions.tools = wrappedTools;
}
