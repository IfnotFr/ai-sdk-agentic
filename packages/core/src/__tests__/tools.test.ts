import { describe, it, expect, vi } from 'vitest';
import { wrapTools } from '../plugins.js';

describe('Tool Wrapping', () => {
  it('should pass tool parameters to wrapTool hook', async () => {
    const mockParameters = { type: 'object', properties: { foo: { type: 'string' } } };
    const originalTool = {
      description: 'Test tool',
      parameters: mockParameters,
      execute: vi.fn().mockResolvedValue('ok'),
    };

    const finalOptions = {
      tools: {
        testTool: originalTool
      }
    };

    let capturedParameters: any;
    const hooks = {
      wrapTool: async (proceed: any, info: any) => {
        capturedParameters = info.parameters;
        return proceed();
      }
    };

    wrapTools(finalOptions, hooks as any);

    const wrappedTool = (finalOptions.tools as any).testTool;
    await wrappedTool.execute({ foo: 'bar' }, { toolCallId: '123' });

    expect(capturedParameters).toEqual(mockParameters);
  });
});
