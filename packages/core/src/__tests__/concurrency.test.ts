import { describe, it, expect, vi } from 'vitest';
import { configureAgent } from '../proxy.js';

describe('Concurrency & Race Conditions', () => {
  it('should not leak plugin context between concurrent calls using the same model instance', async () => {
    const sharedModel = {
      doGenerate: vi.fn().mockImplementation(async () => ({
        content: [{ type: 'text', text: 'response' }]
      })),
    };

    const mockAgent = {
      settings: { model: sharedModel },
      generate: vi.fn().mockImplementation(async (options) => {
        // Simulate AI SDK calling the model
        await (mockAgent.settings.model as any).doGenerate();
        return { text: 'response' };
      })
    } as any;

    const results1: string[] = [];
    const results2: string[] = [];

    const agent1 = configureAgent(mockAgent, [
      async () => ({ onText: (t) => { results1.push('A:' + t); } })
    ]);

    const agent2 = configureAgent(mockAgent, [
      async () => ({ onText: (t) => { results2.push('B:' + t); } })
    ]);

    // Run concurrently
    await Promise.all([
      agent1.generate({}),
      agent2.generate({})
    ]);

    // If there was a race condition, both results might contain A or B mixed up
    // or one might be empty while the other has both.
    expect(results1).toEqual(['A:response']);
    expect(results2).toEqual(['B:response']);
  });
});
