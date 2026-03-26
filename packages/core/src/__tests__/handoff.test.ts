import { describe, it, expect, vi } from 'vitest';
import { withHandoff } from '../plugins/handoff.js';
import { createMission } from '../mission.js';

describe('withHandoff Plugin', () => {
  const mockAgent = {
    generate: vi.fn().mockResolvedValue({ text: 'generated' }),
    stream: vi.fn().mockResolvedValue({ text: Promise.resolve('streamed') }),
  } as any;

  it('should register the handoff tool with correct description', async () => {
    const plugin = withHandoff([
      { name: 'agent1', agent: mockAgent, description: 'Desc 1' },
      { name: 'agent2', agent: mockAgent }
    ]);

    const mission = createMission({});
    const hooks = await plugin({}, mission);
    const handoffTool = (hooks.options?.tools as any).handoff;

    expect(handoffTool).toBeDefined();
    expect(handoffTool.description).toContain('agent1: Desc 1');
    expect(handoffTool.description).toContain('agent2: Specialized agent');
  });

  it('should call generate by default', async () => {
    const plugin = withHandoff([{ name: 'agent1', agent: mockAgent }]);
    const mission = createMission({});
    const hooks = await plugin({}, mission);
    const handoffTool = (hooks.options?.tools as any).handoff;

    await handoffTool.execute({ to: 'agent1', prompt: 'test' });
    expect(mockAgent.generate).toHaveBeenCalledWith({ prompt: 'test' });
  });

  it('should call stream when mode is stream', async () => {
    const plugin = withHandoff([{ name: 'agent1', agent: mockAgent, mode: 'stream' }]);
    const mission = createMission({});
    const hooks = await plugin({}, mission);
    const handoffTool = (hooks.options?.tools as any).handoff;

    await handoffTool.execute({ to: 'agent1', prompt: 'test' });
    expect(mockAgent.stream).toHaveBeenCalledWith({ prompt: 'test' });
  });

  it('should return error if agent not found', async () => {
    const plugin = withHandoff([{ name: 'agent1', agent: mockAgent }]);
    const mission = createMission({});
    const hooks = await plugin({}, mission);
    const handoffTool = (hooks.options?.tools as any).handoff;

    const result = await handoffTool.execute({ to: 'agent2' as any, prompt: 'test' });
    expect(result.status).toBe('error');
    expect(result.message).toContain('not found');
  });
});
