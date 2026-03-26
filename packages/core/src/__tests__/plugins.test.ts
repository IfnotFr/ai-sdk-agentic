import { describe, it, expect } from 'vitest';
import { orchestratePlugins } from '../plugins.js';
import { createMission } from '../mission.js';

describe('Plugin Orchestrator', () => {
  it('should merge options from multiple plugins', async () => {
    const p1 = async () => ({ options: { p1: true } });
    const p2 = async () => ({ options: { p2: true } });
    
    const mission = createMission({});
    const context = await orchestratePlugins([p1, p2], {}, mission);
    
    expect(context.options?.p1).toBe(true);
    expect(context.options?.p2).toBe(true);
  });

  it('should chain hooks correctly', async () => {
    let callOrder: string[] = [];
    
    const p1 = async () => ({ onStart: () => { callOrder.push('p1'); } });
    const p2 = async () => ({ onStart: () => { callOrder.push('p2'); } });
    
    const mission = createMission({});
    const context = await orchestratePlugins([p1, p2], {}, mission);
    
    if (context.onStart) await context.onStart({} as any);
    
    expect(callOrder).toEqual(['p1', 'p2']);
  });
});
