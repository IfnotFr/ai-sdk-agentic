import { 
  generateText,
  streamText,
  OnStartEvent, 
  OnStepStartEvent, 
  OnToolCallStartEvent, 
  OnToolCallFinishEvent, 
  OnStepFinishEvent, 
  OnFinishEvent
} from "ai";

export type GenerateTextOptions = Parameters<typeof generateText>[0];
export type StreamTextOptions = Parameters<typeof streamText>[0];

export type AgenticGenerateOptions = (Partial<GenerateTextOptions> | Partial<StreamTextOptions>) & {
  id?: string;
  [key: string]: any;
};

/**
 * AgenticAgent: Minimum interface for an AI SDK compatible agent.
 */
export interface AgenticAgent {
  generate(options: any): Promise<any>;
  stream(options: any): Promise<any>;
  [key: string]: any;
}

export type AgentInstance = AgenticAgent;

/**
 * AgenticContext: A global interface for sharing data between agents.
 * Users can augment this interface to add their own properties.
 */
export interface AgenticContext {}

export interface AgenticMission {
  id: string;
  context: AgenticContext & Record<string, any>;
  metadata: Record<string, any>;

  agent: {
    id: string;
    metadata: Record<string, any>;
    instance: AgentInstance;
  };
}

export interface AgentEventBase {
  /** The full mission context at the time of the event */
  mission: AgenticMission;
}

export interface AgentTextPayload extends AgentEventBase {
  text: string;
}

export interface AgentErrorPayload extends AgentEventBase {
  error: any;
}

export interface AgentLogPayload extends AgentEventBase {
  type: string;
  message: string;
  options: {
    level: number;
    eol: boolean;
  };
  timestamp: number;
}

export type AgentStartPayload = AgentEventBase & OnStartEvent;
export type AgentStepStartPayload = AgentEventBase & OnStepStartEvent;
export type AgentToolCallStartPayload = AgentEventBase & OnToolCallStartEvent;
export type AgentToolCallFinishPayload = AgentEventBase & OnToolCallFinishEvent;
export type AgentStepFinishPayload = AgentEventBase & OnStepFinishEvent;
export type AgentFinishPayload = AgentEventBase & OnFinishEvent;

export interface AgentEvents {
  "agent.text": AgentTextPayload;
  "agent.log": AgentLogPayload;
  "agent.error": AgentErrorPayload;
  "agent.start": AgentStartPayload;
  "agent.finish": AgentFinishPayload;
  "agent.step.start": AgentStepStartPayload;
  "agent.step.finish": AgentStepFinishPayload;
  "agent.tool.start": AgentToolCallStartPayload;
  "agent.tool.finish": AgentToolCallFinishPayload;
}

export type EventsConfig = {
  [K in keyof AgentEvents]?: boolean;
};

export interface AgenticHooks {
  onStart?: (event: OnStartEvent) => void | Promise<void>;
  onStepStart?: (event: OnStepStartEvent) => void | Promise<void>;
  onToolCallStart?: (event: OnToolCallStartEvent) => void | Promise<void>;
  onToolCallFinish?: (event: OnToolCallFinishEvent) => void | Promise<void>;
  onStepFinish?: (event: OnStepFinishEvent) => void | Promise<void>;
  onFinish?: (event: OnFinishEvent) => void | Promise<void>;
  onError?: (error: any) => void | Promise<void>;
  onText?: (text: string) => void | Promise<void>;
  transformPrompt?: (params: any) => any | Promise<any>;
  wrapAgent?: (proceed: () => Promise<any>) => Promise<any>;
  wrapTool?: (proceed: () => Promise<any>, info: { toolName: string; args: any; toolCallId?: string; parameters: any }) => Promise<any>;
  wrapResult?: (result: any) => any;
  options?: Partial<AgenticGenerateOptions>;
}

export type AgentPlugin = (
  generateOptions: AgenticGenerateOptions, 
  mission: AgenticMission
) => AgenticHooks | Promise<AgenticHooks>;
