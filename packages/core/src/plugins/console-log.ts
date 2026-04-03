import { AgentPlugin, AgenticGenerateOptions, AgenticMission } from "../types.js";
import { useEvents } from "../events.js";
import chalk from "chalk";

export interface WithConsoleLoggerOptions {
  name?: string;
  color?: "magenta" | "cyan" | "white" | "yellow" | "blue" | "green" | "red";
}

/**
 * withConsoleLogger: Elegant structured console output for agent activities.
 */
export const withConsoleLogger = (options: WithConsoleLoggerOptions = {}): AgentPlugin => {
  return async (generateOptions: AgenticGenerateOptions, mission: AgenticMission) => {
    const events = useEvents();
    const name = options.name || "Agent";
    const color = options.color || "white";
    
    mission.agent.metadata.log = { name, color };

    const chalkColor = (chalk as any)[color] || chalk.white;
    const prefix = chalkColor(`[${name}]`);

    let isStreaming = false;
    let streamStarted = false;
    let isLineOpen = false;

    const handler = (entry: any) => {
      // Only process logs for this specific agent in this specific mission
      if (entry.mission.id !== mission.id) return;
      if (entry.mission.agent.id !== mission.agent.id) return;
      
      const isNewLogStream = entry.options.eol === false;
      const isChatStyle = entry.type === "agent-text";

      if (isStreaming && (entry.options.eol || (entry.type !== 'agent-text' && entry.type !== 'text'))) {
        if (streamStarted) process.stdout.write("\n");
        isStreaming = false;
        streamStarted = false;
        isLineOpen = false;
        if (entry.message === "" && entry.options.eol) return;
      }

      const level = Math.max(0, entry.options.level);
      const indent = "  ".repeat(level);
      const chatPrefix = isChatStyle ? chalk.gray("💬 ") : "";
      
      let message = entry.message || "";
      if (isChatStyle) message = chalk.italic(message.replace(/\n/g, " "));
      else if (entry.type === "error") message = chalk.red(message);
      
      if (isNewLogStream) {
        if (isChatStyle && !streamStarted && (!message || !message.trim())) return;

        if (!isLineOpen) {
          process.stdout.write(`${prefix} ${indent}${chatPrefix}`);
          isLineOpen = true;
          if (isChatStyle) {
            isStreaming = true;
            streamStarted = true;
          }
        }

        if (isChatStyle) {
          process.stdout.write(message);
        } else if (message.includes("\n")) {
          const lines = message.split("\n");
          process.stdout.write(lines.join(`\n${prefix} ${indent}${chatPrefix}`));
        } else {
          process.stdout.write(message);
        }
      } else {
        if (isChatStyle && !message.trim()) return;
        
        if (!isLineOpen) {
          process.stdout.write(`${prefix} ${indent}${chatPrefix}`);
        }
        process.stdout.write(`${message}\n`);
        isLineOpen = false;
        isStreaming = false;
        streamStarted = false;
      }
    };

    const textHandler = (payload: any) => {
      handler({ ...payload, type: "agent-text", message: payload.text, options: { level: 1, eol: false } });
    };

    events.on("agent.log", handler);
    events.on("agent.text", textHandler);

    const cleanup = () => {
      events.off("agent.log", handler);
      events.off("agent.text", textHandler);
    };

    return {
      onStart: () => {
        events.log(chalk.inverse(` Starting mission: ${mission.id} `), { level: 0 });
        events.log(chalk.dim(JSON.stringify(generateOptions)), { level: 0 });
      },
      onStepStart: (step: any) => {
        events.log(chalk.yellow.bold(`Starting Step ${step.stepNumber} ...`), { level: 0 });
        events.emit("agent.log", { 
          mission, 
          type: "agent-text", 
          message: "", 
          options: { level: 1, eol: false },
          timestamp: Date.now()
        });
      },
      onToolCallStart: (event: any) => {
        const { toolName, input } = event.toolCall as any;
        const toolLabel = chalk.bold(`🛠️  Calling tool: ${chalk.yellow(toolName)} `);
        const argsLabel = chalk.dim(JSON.stringify(input));
        events.log(toolLabel + argsLabel, { level: 1 });
      },
      onToolCallFinish: (event: any) => {
        const { toolName } = event.toolCall;
        if (event.error) {
          events.error(`Tool ${toolName} failed: ${event.error}`, { level: 1 });
        } else {
          const rawResult = (event as any).result ?? (event as any).toolResult ?? (event as any).output;
          let resultDisplay = "OK";
          if (rawResult !== undefined && rawResult !== null) {
            try {
              resultDisplay = typeof rawResult === 'string' ? rawResult : JSON.stringify(rawResult);
            } catch (e) {
              resultDisplay = "[Complex Object]";
            }
          }
          const returnLabel = chalk.bold(`Tool ${chalk.yellow(toolName)} returned: `);
          const resultLabel = chalk.dim(resultDisplay);
          events.log(returnLabel + resultLabel, { level: 1 });
        }
      },
      onFinish: (event: any) => {
        if (isLineOpen) {
          process.stdout.write("\n");
          isLineOpen = false;
        }
        const usage = (event as any).usage ? ` (${(event as any).usage.totalTokens} tokens)` : "";
        events.log(chalk.bold(`Mission finished.${usage}`), { level: 0 });
        cleanup();
      },
      onError: (error: any) => {
        cleanup();
      }
    };
  };
};
