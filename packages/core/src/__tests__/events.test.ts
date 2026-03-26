import { describe, it, expect, vi } from 'vitest';
import { configureAgent } from '../proxy.js';
import { useEvents } from '../events.js';

const mockAgent = {
  settings: {
    model: {
      doGenerate: vi.fn().mockResolvedValue({ content: [{ type: 'text', text: 'hello' }] }),
    }
  },
  generate: vi.fn().mockImplementation(async (options) => {
    if (options.experimental_onStart) await options.experimental_onStart({ model: {} } as any);
    await (mockAgent.settings.model as any).doGenerate();
    if (options.onFinish) await options.onFinish({ text: 'hello' } as any);
    return { text: 'hello' };
  })
} as any;

describe('Unified Event Bus', () => {
  it('should emit lifecycle events automatically', async () => {
    const events: string[] = [];
    const bus = useEvents();
    bus.onAny((name) => events.push(name));

    const agent = configureAgent(mockAgent, []);
    await agent.generate({ id: 'event-test' });

    expect(events).toContain('agent.start');
    expect(events).toContain('agent.text');
    expect(events).toContain('agent.finish');
    
    bus.removeAllListeners();
  });

  it('should emit log events through useEvents helpers', async () => {
    let capturedLog: any;
    const bus = useEvents();
    bus.on('agent.log', (payload) => {
      capturedLog = payload;
    });

    const agent = configureAgent(mockAgent, [
      async () => ({
        onStart: () => {
          useEvents().info('test log');
        }
      })
    ]);

    await agent.generate({});
    expect(capturedLog.message).toBe('test log');
    expect(capturedLog.type).toBe('info');
    
    bus.removeAllListeners();
  });

  it('should emit agent.error when agent fails', async () => {
    let capturedError: any;
    const bus = useEvents();
    bus.on('agent.error', (payload) => {
      capturedError = payload;
    });

    const failingAgent = {
      settings: { model: {} },
      generate: vi.fn().mockRejectedValue(new Error('crash')),
      stream: vi.fn(),
    } as any;

    const agent = configureAgent(failingAgent, []);
    
    await expect(agent.generate({})).rejects.toThrow('crash');
    expect(capturedError.error.message).toBe('crash');
    
    bus.removeAllListeners();
  });
});
