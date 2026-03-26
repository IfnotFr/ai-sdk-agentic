import { EventEmitter } from "node:events";
import { getMission } from "./mission.js";
import { AgentLogPayload } from "./types.js";

export type LogType = "info" | "warn" | "error" | "success" | "text" | "agent-text";

export interface LogOptions {
  level?: number;
  eol?: boolean;
}

/**
 * AgentEventBus: Central event management with built-in logging helpers.
 */
class AgentEventBus extends EventEmitter {
  onAny(handler: (event: string, payload: any) => void) {
    this.on("*", handler);
    return () => this.off("*", handler);
  }

  override emit(event: string | symbol, ...args: any[]): boolean {
    const result = super.emit(event, ...args);
    if (event !== "*") {
      super.emit("*", event, ...args);
    }
    return result;
  }

  /**
   * Internal log emission helper.
   */
  private emitLog(type: LogType, message: string, options: LogOptions = {}) {
    const mission = getMission();
    if (!mission) return;

    const entry: AgentLogPayload = {
      mission,
      type,
      message,
      options: {
        level: options.level ?? 2,
        eol: options.eol ?? true,
      },
      timestamp: Date.now(),
    };

    this.emit("agent.log", entry);
  }

  log(msg: string, opts?: LogOptions) { this.emitLog("info", msg, opts); }
  info(msg: string, opts?: LogOptions) { this.emitLog("info", msg, opts); }
  warn(msg: string, opts?: LogOptions) { this.emitLog("warn", msg, opts); }
  error(msg: string, opts?: LogOptions) { this.emitLog("error", msg, opts); }
  success(msg: string, opts?: LogOptions) { this.emitLog("success", msg, opts); }
  write(msg: string, opts?: LogOptions) { this.emitLog("text", msg, { ...opts, eol: false }); }
}

const eventBus = new AgentEventBus();

/**
 * useEvents: Access the central event bus for emitting logs or listening to activities.
 */
export function useEvents() {
  return eventBus;
}
