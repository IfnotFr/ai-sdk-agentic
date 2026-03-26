export interface OfficeAgentEntry {
  id: string;
  name: string;
  tools: string[];
  positions: string[];
}

export interface OfficeRegistryData {
  positions: string[];
  agents: OfficeAgentEntry[];
}

const REGISTRY_SYMBOL = Symbol.for("ai-sdk-office-server:registry");

/**
 * OfficeRegistry: Centralized store for agents and positions.
 * Uses a global singleton to handle race conditions between plugin init and server start.
 */
class OfficeRegistry {
  private static instance: OfficeRegistry;
  private data: {
    positions: Set<string>;
    agents: Map<string, OfficeAgentEntry>;
  };

  private constructor() {
    const g = global as any;
    if (!g[REGISTRY_SYMBOL]) {
      g[REGISTRY_SYMBOL] = {
        positions: new Set<string>(),
        agents: new Map<string, OfficeAgentEntry>()
      };
    }
    this.data = g[REGISTRY_SYMBOL];
  }

  public static getInstance(): OfficeRegistry {
    if (!OfficeRegistry.instance) {
      OfficeRegistry.instance = new OfficeRegistry();
    }
    return OfficeRegistry.instance;
  }

  public registerAgent(agent: OfficeAgentEntry) {
    // Add tools and positions to global sets if needed
    agent.positions.forEach(p => this.data.positions.add(p));
    
    // Store agent entry
    this.data.agents.set(agent.id, agent);
  }

  public registerPosition(position: string) {
    this.data.positions.add(position);
  }

  public getSnapshot(): OfficeRegistryData {
    return {
      positions: Array.from(this.data.positions),
      agents: Array.from(this.data.agents.values())
    };
  }
}

export const officeRegistry = OfficeRegistry.getInstance();
