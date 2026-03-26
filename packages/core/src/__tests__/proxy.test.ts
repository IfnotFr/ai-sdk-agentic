import { describe, it, expect, vi } from 'vitest';
import { configureAgent, useMission } from '../proxy.js';

const mockAgent = {
  settings: {
    model: {
      doGenerate: vi.fn().mockResolvedValue({ content: [] }),
    }
  },
  generate: vi.fn().mockImplementation(async (options) => {
    if (options.experimental_onStart) await options.experimental_onStart();
    if (options.onFinish) await options.onFinish({ result: { text: 'ok' } });
    return { text: 'ok' };
  })
} as any;

describe('Proxy Integration', () => {
  it('should run a complete agent mission with plugins and fresh context', async () => {
    let capturedContext: any;
    let missionId: string | undefined;
    let agentId: string | undefined;

    const agent = configureAgent(mockAgent, [
      async () => ({
        onStart: () => { 
          const mission = useMission();
          mission.context.foo = 'bar';
          missionId = mission.id;
          agentId = mission.agent.id;
        },
        onFinish: () => {
          const { context } = useMission();
          capturedContext = { ...context };
        }
      })
    ]);

    await agent.generate({ id: 'custom-id' });
    
    expect(missionId).toBe('custom-id');
    expect(agentId).toBeDefined();
    expect(capturedContext.foo).toBe('bar');
  });

  it('should support handoff-style nested execution', async () => {
    let childMissionId: string | undefined;
    let childAgentId: string | undefined;
    let parentAgentId: string | undefined;

    const child = configureAgent(mockAgent, [
      async () => ({
        onStart: () => { 
          const { id, agent } = useMission();
          childMissionId = id;
          childAgentId = agent.id;
        }
      })
    ]);

    const parent = configureAgent(mockAgent, [
      async () => ({
        onStart: async () => {
          parentAgentId = useMission().agent.id;
          await child.generate({});
        }
      })
    ]);

    await parent.generate({ id: 'parent-123' });
    expect(childMissionId).toBe('parent-123');
    expect(childAgentId).toBeDefined();
    expect(childAgentId).not.toBe(parentAgentId);
  });
});
