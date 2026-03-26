import { describe, it, expect, vi } from 'vitest';
import { proxyModel } from '../model.js';
import { runWithHooks } from '../mission.js';

describe('Model Module', () => {
  it('should intercept text from doGenerate', async () => {
    let captured = '';
    const agent = {
      settings: {
        model: {
          doGenerate: vi.fn().mockResolvedValue({ 
            content: [{ type: 'text', text: 'interception' }] 
          })
        }
      }
    };

    const hooks = { onText: (text: string) => { captured += text; } };
    agent.settings.model = proxyModel(agent);
    
    await runWithHooks(hooks, () => agent.settings.model.doGenerate());
    expect(captured).toBe('interception');
  });

  it('should transform prompt params', async () => {
    const agent = {
      settings: {
        model: {
          doGenerate: vi.fn().mockImplementation((params) => {
            expect(params.prompt).toBe('transformed');
            return { content: [] };
          })
        }
      }
    };

    const hooks = { 
      transformPrompt: (params: any) => ({ ...params, prompt: 'transformed' }) 
    };
    agent.settings.model = proxyModel(agent);
    
    await runWithHooks(hooks, () => agent.settings.model.doGenerate({ prompt: 'original' }));
  });

  it('should handle streaming text intercept', async () => {
    let captured = '';
    const mockStream = new ReadableStream({
      start(controller) {
        controller.enqueue({ type: 'text-delta', delta: 'stream-' });
        controller.enqueue({ type: 'text-delta', delta: 'ing' });
        controller.close();
      }
    });

    const agent = {
      settings: {
        model: {
          doStream: vi.fn().mockResolvedValue({ stream: mockStream })
        }
      }
    };

    const hooks = { onText: (text: string) => { captured += text; } };
    agent.settings.model = proxyModel(agent);
    
    const result: any = await runWithHooks(hooks, () => agent.settings.model.doStream());
    const reader = result.stream.getReader();
    while (!(await reader.read()).done); // exhaust stream

    expect(captured).toBe('stream-ing');
  });
});
